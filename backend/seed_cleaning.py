"""Seed cleaning standards, mappings, and AiM property codes.

Run inside backend container::

    docker compose run --rm backend python seed_cleaning.py
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from database import SessionLocal
from models import (
    AimPropertyMapping,
    Building,
    CleaningSettings,
    CleaningSpaceType,
    CleaningUnit,
    SpaceTypeMapping,
)

DEFAULT_SPACE_TYPES = [
    ("restroom_1_stall", "1-stall restroom", 15.0, CleaningUnit.per_space, 10),
    ("restroom_3_stall", "3-stall restroom", 30.0, CleaningUnit.per_space, 11),
    ("classroom", "Classroom", 25.0, CleaningUnit.per_space, 20),
    ("lab", "Lab", 10.0, CleaningUnit.per_space, 30),
    ("lecture_hall", "Lecture hall", 45.0, CleaningUnit.per_space, 25),
    ("elevator", "Elevator", 10.0, CleaningUnit.per_space, 40),
    ("corridor", "Public corridor", 15.0, CleaningUnit.per_space, 50),
    ("office", "Single office", 5.0, CleaningUnit.per_space, 60),
    ("stairs", "Stairs", 5.0, CleaningUnit.per_space, 70),
    ("storeroom", "Storeroom", 10.0, CleaningUnit.per_space, 80),
    ("unmapped_sqft", "Unmapped (sqft fallback)", 0.01, CleaningUnit.per_sqft, 999),
]

# (slug, match_field, match_kind, match_value, priority)
DEFAULT_MAPPINGS = [
    ("lecture_hall", "description", "contains", "LECTURE", 100),
    ("lecture_hall", "description", "contains", "AUDITORIUM", 100),
    ("elevator", "description", "contains", "ELEVATOR", 90),
    ("stairs", "description", "contains", "STAIRWAY", 85),
    ("stairs", "description", "contains", "STAIRS", 85),
    ("restroom_3_stall", "description", "contains", "3-STALL", 80),
    ("restroom_1_stall", "description", "contains", "RESTROOM", 75),
    ("corridor", "description", "contains", "PUBLIC CORRIDOR", 70),
    ("corridor", "description", "contains", "CORRIDOR", 65),
    ("corridor", "description", "contains", "CIRCULATION AREA", 60),
    ("classroom", "description", "contains", "CLASSROOM", 55),
    ("lab", "description", "contains", "LABORATORY", 50),
    ("lab", "description", "contains", "LAB", 45),
    ("lab", "description", "contains", "RESEARCH", 44),
    ("lab", "description", "contains", "PROCEDURE", 43),
    ("storeroom", "description", "contains", "STOREROOM", 40),
    ("storeroom", "description", "contains", "STORAGE", 39),
    ("office", "description", "contains", "OFFICE", 30),
    ("office", "description", "exact", "0", 20),
    ("office", "description", "exact", "1", 20),
    ("office", "description", "exact", "2", 20),
]

PROPERTY_TO_BUILDING_CODE = {
    1002: "HAWAII",
    1162: "POST",
    1175: "MOORE",
    1263: "LSB",
}


def _slug_to_type(db: Session) -> dict[str, CleaningSpaceType]:
    return {t.slug: t for t in db.query(CleaningSpaceType).all()}


def seed_cleaning(db: Session) -> None:
    for slug, label, minutes, unit, sort_order in DEFAULT_SPACE_TYPES:
        existing = db.query(CleaningSpaceType).filter(CleaningSpaceType.slug == slug).first()
        if existing is None:
            db.add(
                CleaningSpaceType(
                    slug=slug,
                    label=label,
                    minutes_per_unit=minutes,
                    unit=unit.value,
                    sort_order=sort_order,
                    is_active=True,
                )
            )
        else:
            existing.label = label
            existing.minutes_per_unit = minutes
            existing.unit = unit.value
            existing.sort_order = sort_order
    db.flush()

    settings = db.query(CleaningSettings).filter(CleaningSettings.id == 1).first()
    if settings is None:
        db.add(
            CleaningSettings(
                id=1,
                workday_minutes=480,
                sqft_preference="polyline_sqft,cad_gross,user_sqft",
            )
        )
    db.flush()

    slug_map = _slug_to_type(db)
    for type_slug, field, kind, value, priority in DEFAULT_MAPPINGS:
        st = slug_map.get(type_slug)
        if st is None:
            continue
        exists = (
            db.query(SpaceTypeMapping)
            .filter(
                SpaceTypeMapping.cleaning_space_type_id == st.id,
                SpaceTypeMapping.match_field == field,
                SpaceTypeMapping.match_kind == kind,
                SpaceTypeMapping.match_value == value,
            )
            .first()
        )
        if exists is None:
            db.add(
                SpaceTypeMapping(
                    cleaning_space_type_id=st.id,
                    match_field=field,
                    match_kind=kind,
                    match_value=value,
                    priority=priority,
                    is_active=True,
                )
            )
    db.flush()

    for prop_code, building_code in PROPERTY_TO_BUILDING_CODE.items():
        b = db.query(Building).filter(Building.building_code == building_code).first()
        if b is None:
            print(f"Skip property {prop_code}: building {building_code} not found")
            continue
        m = (
            db.query(AimPropertyMapping)
            .filter(AimPropertyMapping.property_code == prop_code)
            .first()
        )
        if m is None:
            db.add(AimPropertyMapping(property_code=prop_code, building_id=b.id))
        else:
            m.building_id = b.id

    db.commit()
    print("Seeded cleaning space types, mappings, settings, and property mappings.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_cleaning(db)
    finally:
        db.close()
