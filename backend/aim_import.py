"""Import AiM Excel extracts into building_spaces."""
from __future__ import annotations

import uuid
from io import BytesIO
from typing import Any, BinaryIO, List, Optional, Tuple

import pandas as pd
from sqlalchemy.orm import Session

from models import (
    AimPropertyMapping,
    Building,
    BuildingSpace,
    CleaningSettings,
    CleaningSpaceType,
    SpaceTypeMapping,
)
from workload import (
    effective_sqft_from_row,
    minutes_for_space,
    parse_sqft_preference,
    resolve_space_type,
)

AIM_COLUMNS = {
    "Location": "location_code",
    "Property": "property_code",
    "Description": "description",
    "Location Type Group": "location_type_group",
    "Primary Type": "primary_type",
    "User Sqft": "user_sqft",
    "Survey Sqft": "survey_sqft",
    "CAD Gross": "cad_gross",
    "Polyline Sqft": "polyline_sqft",
}


def _normalize_row(raw: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for src, dst in AIM_COLUMNS.items():
        if src in raw:
            out[dst] = raw[src]
    loc = out.get("location_code")
    if loc is not None:
        out["location_code"] = str(loc).strip()
    desc = out.get("description")
    if desc is not None and not (isinstance(desc, float) and pd.isna(desc)):
        out["description"] = str(desc).strip()
    else:
        out["description"] = None
    for k in ("primary_type", "location_type_group"):
        v = out.get(k)
        if v is not None and not (isinstance(v, float) and pd.isna(v)):
            out[k] = str(v).strip()
        else:
            out[k] = None
    prop = out.get("property_code")
    if prop is not None and not (isinstance(prop, float) and pd.isna(prop)):
        try:
            out["property_code"] = int(float(prop))
        except (TypeError, ValueError):
            out["property_code"] = None
    else:
        out["property_code"] = None
    for sqft_key in ("user_sqft", "cad_gross", "polyline_sqft", "survey_sqft"):
        v = out.get(sqft_key)
        if v is None or (isinstance(v, float) and pd.isna(v)):
            out[sqft_key] = None
        else:
            try:
                out[sqft_key] = float(v)
            except (TypeError, ValueError):
                out[sqft_key] = None
    return out


def read_aim_dataframe(file: BinaryIO) -> pd.DataFrame:
    return pd.read_excel(file, sheet_name=0, engine="openpyxl")


def import_aim_for_building(
    db: Session,
    building_id: int,
    file: BinaryIO,
    *,
    replace_existing: bool = True,
) -> dict[str, Any]:
    building = db.query(Building).filter(Building.id == building_id).first()
    if building is None:
        raise ValueError("Building not found")

    prop_map = {
        m.property_code: m.building_id
        for m in db.query(AimPropertyMapping).all()
    }
    allowed_codes = [code for code, bid in prop_map.items() if bid == building_id]
    if not allowed_codes:
        raise ValueError(
            f"No AiM property mapping for building {building.building_code or building_id}"
        )

    settings = db.query(CleaningSettings).filter(CleaningSettings.id == 1).first()
    preference = parse_sqft_preference(settings) if settings else [
        "polyline_sqft",
        "cad_gross",
        "user_sqft",
    ]
    pref_row_keys = {
        "polyline_sqft": "polyline_sqft",
        "cad_gross": "cad_gross",
        "user_sqft": "user_sqft",
    }

    types = {
        t.id: t
        for t in db.query(CleaningSpaceType).filter(CleaningSpaceType.is_active).all()
    }
    unmapped = next((t for t in types.values() if t.slug == "unmapped_sqft"), None)
    mappings = db.query(SpaceTypeMapping).all()

    df = read_aim_dataframe(file)
    batch_id = str(uuid.uuid4())
    imported = 0
    skipped_property: List[int] = []
    skipped_rows = 0

    if replace_existing:
        db.query(BuildingSpace).filter(BuildingSpace.building_id == building_id).delete()
        db.flush()

    # AiM sometimes repeats the same Location code for multiple rows; keep all rows
    # with disambiguated codes so they count toward workload.
    location_seen: dict[str, int] = {}

    for _, series in df.iterrows():
        raw = series.to_dict()
        row = _normalize_row(raw)
        prop = row.get("property_code")
        if prop not in allowed_codes:
            if prop is not None and prop not in skipped_property:
                skipped_property.append(prop)
            skipped_rows += 1
            continue
        loc = row.get("location_code")
        if not loc:
            skipped_rows += 1
            continue
        if loc in location_seen:
            location_seen[loc] += 1
            loc = f"{loc}~{location_seen[loc]}"
        else:
            location_seen[loc] = 1

        eff = effective_sqft_from_row(
            {pref_row_keys.get(k, k): row.get(k) for k in preference},
            preference,
        )
        st = resolve_space_type(row, mappings, types)
        if st is None:
            st = unmapped
        mins = minutes_for_space(st, eff, unmapped)

        db.add(
            BuildingSpace(
                building_id=building_id,
                location_code=loc,
                description=row.get("description"),
                primary_type=row.get("primary_type"),
                location_type_group=row.get("location_type_group"),
                user_sqft=row.get("user_sqft"),
                cad_gross=row.get("cad_gross"),
                polyline_sqft=row.get("polyline_sqft"),
                effective_sqft=eff,
                cleaning_space_type_id=st.id if st else None,
                cleaning_minutes=mins,
                source_property_code=prop,
                import_batch_id=batch_id,
            )
        )
        imported += 1

    db.commit()
    return {
        "building_id": building_id,
        "import_batch_id": batch_id,
        "imported_count": imported,
        "skipped_rows": skipped_rows,
        "skipped_property_codes": skipped_property,
        "allowed_property_codes": allowed_codes,
    }


def import_aim_file_path(db: Session, building_id: int, path: str) -> dict[str, Any]:
    with open(path, "rb") as fh:
        return import_aim_for_building(db, building_id, fh)


if __name__ == "__main__":
    import argparse

    from database import SessionLocal
    from models import Building

    parser = argparse.ArgumentParser(description="Import AiM Excel into building_spaces")
    parser.add_argument("--file", required=True, help="Path to .xlsx file")
    parser.add_argument("--building-code", required=True, help="e.g. POST, HAWAII")
    args = parser.parse_args()
    db = SessionLocal()
    try:
        b = db.query(Building).filter(Building.building_code == args.building_code).first()
        if b is None:
            raise SystemExit(f"Building not found: {args.building_code}")
        result = import_aim_file_path(db, b.id, args.file)
        print(result)
    finally:
        db.close()
