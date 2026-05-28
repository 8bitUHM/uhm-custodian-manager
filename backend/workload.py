"""Workload calculation from imported building spaces and cleaning standards."""
from __future__ import annotations

import math
import re
from collections import defaultdict
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, List, Optional, Sequence

from sqlalchemy.orm import Session

from models import (
    BuildingSpace,
    CleaningSettings,
    CleaningSpaceType,
    CleaningUnit,
    SpaceTypeMapping,
)


def _to_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    try:
        f = float(value)
        if math.isnan(f):
            return None
        return f
    except (TypeError, ValueError):
        return None


def effective_sqft_from_row(
    row: dict[str, Any],
    preference: Sequence[str],
) -> Optional[float]:
    for key in preference:
        val = _to_float(row.get(key))
        if val is not None and val > 0:
            return val
    return None


def parse_sqft_preference(settings: CleaningSettings) -> List[str]:
    raw = (settings.sqft_preference or "polyline_sqft,cad_gross,user_sqft").strip()
    keys = [k.strip() for k in raw.split(",") if k.strip()]
    return keys or ["polyline_sqft", "cad_gross", "user_sqft"]


def row_field_value(row: dict[str, Any], field: str) -> str:
    if field == "primary_type":
        return str(row.get("primary_type") or "").strip().upper()
    return str(row.get("description") or "").strip().upper()


def match_mapping(
    row: dict[str, Any],
    mapping: SpaceTypeMapping,
) -> bool:
    if not mapping.is_active:
        return False
    hay = row_field_value(row, mapping.match_field)
    needle = (mapping.match_value or "").strip().upper()
    if not needle:
        return False
    kind = (mapping.match_kind or "contains").lower()
    if kind == "exact":
        return hay == needle
    if kind == "contains":
        return needle in hay
    if kind == "regex":
        try:
            return bool(re.search(needle, hay, re.IGNORECASE))
        except re.error:
            return False
    return False


def resolve_space_type(
    row: dict[str, Any],
    mappings: Sequence[SpaceTypeMapping],
    types_by_id: dict[int, CleaningSpaceType],
) -> Optional[CleaningSpaceType]:
    active = [m for m in mappings if m.is_active]
    active.sort(key=lambda m: m.priority, reverse=True)
    for m in active:
        if match_mapping(row, m):
            return types_by_id.get(m.cleaning_space_type_id)
    return None


def minutes_for_space(
    space_type: Optional[CleaningSpaceType],
    effective_sqft: Optional[float],
    unmapped_type: Optional[CleaningSpaceType],
) -> float:
    st = space_type or unmapped_type
    if st is None:
        return 0.0
    unit = (st.unit or CleaningUnit.per_space.value).lower()
    if unit == CleaningUnit.per_sqft.value:
        sqft = effective_sqft or 0.0
        return st.minutes_per_unit * sqft
    return st.minutes_per_unit


@dataclass
class SpaceTypeBreakdown:
    space_type_id: Optional[int]
    slug: str
    label: str
    count: int
    minutes: float


@dataclass
class UnmappedSpaceSample:
    location_code: str
    description: Optional[str]
    effective_sqft: Optional[float]
    minutes: float


@dataclass
class BuildingWorkload:
    building_id: int
    total_minutes: float
    workday_minutes: int
    recommended_headcount: int
    imported_space_count: int
    last_import_at: Optional[Any]
    by_space_type: List[SpaceTypeBreakdown]
    unmapped_samples: List[UnmappedSpaceSample]


def compute_building_workload(
    db: Session,
    building_id: int,
) -> BuildingWorkload:
    settings = db.query(CleaningSettings).filter(CleaningSettings.id == 1).first()
    workday = settings.workday_minutes if settings else 480

    from sqlalchemy.orm import joinedload

    spaces = (
        db.query(BuildingSpace)
        .options(joinedload(BuildingSpace.cleaning_space_type))
        .filter(BuildingSpace.building_id == building_id)
        .all()
    )
    last_import = max((s.imported_at for s in spaces), default=None)

    by_type: dict[Optional[int], SpaceTypeBreakdown] = {}
    unmapped_samples: List[UnmappedSpaceSample] = []
    total = 0.0

    for sp in spaces:
        total += sp.cleaning_minutes or 0.0
        tid = sp.cleaning_space_type_id
        st = sp.cleaning_space_type
        slug = st.slug if st else "unmapped"
        label = st.label if st else "Unmapped"
        if tid not in by_type:
            by_type[tid] = SpaceTypeBreakdown(
                space_type_id=tid,
                slug=slug,
                label=label,
                count=0,
                minutes=0.0,
            )
        by_type[tid].count += 1
        by_type[tid].minutes += sp.cleaning_minutes or 0.0
        if st and st.slug == "unmapped_sqft":
            unmapped_samples.append(
                UnmappedSpaceSample(
                    location_code=sp.location_code,
                    description=sp.description,
                    effective_sqft=_to_float(sp.effective_sqft),
                    minutes=sp.cleaning_minutes or 0.0,
                )
            )

    unmapped_samples.sort(key=lambda u: -(u.minutes or 0))
    unmapped_samples = unmapped_samples[:20]

    headcount = math.ceil(total / workday) if workday > 0 and total > 0 else 0

    breakdown = sorted(by_type.values(), key=lambda b: -b.minutes)

    return BuildingWorkload(
        building_id=building_id,
        total_minutes=round(total, 2),
        workday_minutes=workday,
        recommended_headcount=headcount,
        imported_space_count=len(spaces),
        last_import_at=last_import,
        by_space_type=breakdown,
        unmapped_samples=unmapped_samples,
    )


def recompute_space_minutes_for_building(db: Session, building_id: int) -> int:
    """Recalculate cleaning_minutes on all spaces using current types/settings."""
    settings = db.query(CleaningSettings).filter(CleaningSettings.id == 1).first()
    preference = parse_sqft_preference(settings) if settings else [
        "polyline_sqft",
        "cad_gross",
        "user_sqft",
    ]
    types = {t.id: t for t in db.query(CleaningSpaceType).filter(CleaningSpaceType.is_active).all()}
    unmapped = next((t for t in types.values() if t.slug == "unmapped_sqft"), None)
    mappings = db.query(SpaceTypeMapping).all()

    spaces = db.query(BuildingSpace).filter(BuildingSpace.building_id == building_id).all()
    for sp in spaces:
        row = {
            "description": sp.description,
            "primary_type": sp.primary_type,
            "polyline_sqft": sp.polyline_sqft,
            "cad_gross": sp.cad_gross,
            "user_sqft": sp.user_sqft,
        }
        eff = _to_float(sp.effective_sqft)
        if eff is None:
            eff = effective_sqft_from_row(
                {
                    "polyline_sqft": sp.polyline_sqft,
                    "cad_gross": sp.cad_gross,
                    "user_sqft": sp.user_sqft,
                },
                preference,
            )
            sp.effective_sqft = eff
        st = resolve_space_type(row, mappings, types)
        if st is None and unmapped:
            st = unmapped
        sp.cleaning_space_type_id = st.id if st else None
        sp.cleaning_minutes = minutes_for_space(st, eff, unmapped)
    db.commit()
    return len(spaces)
