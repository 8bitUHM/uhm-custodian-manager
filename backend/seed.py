"""Seed the database with the BGM custodial hierarchy.

Loads ``seed_data.json`` (extracted from ``EMPLOYEE GROUP INFO.xlsx``) and
populates three tables in dependency order:

    Supervisor (3, one per wing)
        -> J3 (18, six per wing, one per work group)
            -> Custodian (~120 Janitor IIs, linked to their JIII by group)

The script is idempotent: it clears custodian/JIII/SII tables first so re-running
will produce a deterministic state. It upserts the **Shidler** building row
(``public_slug`` for static floor assets) and does not otherwise touch ``tasks``.

Run inside the backend container::

    docker compose run --rm backend python seed.py
"""
from __future__ import annotations

import json
from datetime import date, datetime
from pathlib import Path

from sqlalchemy.orm import Session

from database import SessionLocal
from models import Building, BuildingPartitionRotation, Custodian, J3, Supervisor

DATA_FILE = Path(__file__).with_name("seed_data.json")
SEED_BUILDINGS = [
    {
        "name": "Shidler",
        "address": "University of Hawaiʻi at Mānoa",
        "building_code": "SHIDLER",
        "floors": 6,
        "description": "Shidler Hall of Business",
        "public_slug": "shidler",
    },
    {
        "name": "POST",
        "address": "University of Hawaiʻi at Mānoa",
        "building_code": "POST",
        "floors": 9,
        "description": "POST building",
        "public_slug": "post",
    },
    {
        "name": "Moore",
        "address": "University of Hawaiʻi at Mānoa",
        "building_code": "MOORE",
        "floors": 8,
        "description": "Moore Hall",
        "public_slug": "moore",
    },
    {
        "name": "LSB",
        "address": "University of Hawaiʻi at Mānoa",
        "building_code": "LSB",
        "floors": None,
        "description": "Life Sciences Building",
        "public_slug": "lsb",
    },
    {
        "name": "Hawaii Hall",
        "address": "University of Hawaiʻi at Mānoa",
        "building_code": "HAWAII",
        "floors": 3,
        "description": "Hawaii Hall",
        "public_slug": "hawaii",
    },
]


def _parse_date(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _upsert_seed_buildings(db: Session) -> None:
    for payload in SEED_BUILDINGS:
        b = (
            db.query(Building)
            .filter(Building.building_code == payload["building_code"])
            .first()
        )
        if b is None:
            db.add(
                Building(
                    name=payload["name"],
                    address=payload["address"],
                    building_code=payload["building_code"],
                    floors=payload["floors"],
                    description=payload["description"],
                    public_slug=payload["public_slug"],
                    is_active=True,
                )
            )
            print(
                f"Added building: {payload['name']} "
                f"(public_slug={payload['public_slug']})."
            )
            continue

        # Keep viewer identity fields in sync without overwriting custom edits.
        b.name = payload["name"]
        b.public_slug = payload["public_slug"]
        if payload["floors"] is not None:
            b.floors = payload["floors"]
        if not b.address:
            b.address = payload["address"]
    db.commit()


def seed() -> None:
    if not DATA_FILE.exists():
        raise FileNotFoundError(
            f"Seed data file not found at {DATA_FILE}. "
            "Make sure seed_data.json is present in the backend/ folder."
        )

    with DATA_FILE.open(encoding="utf-8") as fh:
        data = json.load(fh)

    db: Session = SessionLocal()
    try:
        # Clear in FK-safe order: Custodian -> J3 -> Supervisor.
        db.query(Custodian).delete()
        db.query(J3).delete()
        db.query(Supervisor).delete()
        db.commit()

        # 1) Supervisors keyed by wing.
        wing_to_supervisor: dict[str, Supervisor] = {}
        for entry in data["supervisors"]:
            sup = Supervisor(
                name=entry["name"],
                wing=entry.get("wing"),
                org_code=entry.get("org_code"),
                position_id=entry.get("position_id"),
                uh_id=entry.get("uh_id"),
            )
            db.add(sup)
            wing_to_supervisor[entry["wing"]] = sup
        db.flush()  # populate sup.id

        # 2) JIIIs keyed by group number.
        group_to_j3: dict[int, J3] = {}
        for entry in data["j3s"]:
            wing = entry["wing"]
            sup = wing_to_supervisor.get(wing)
            if sup is None:
                raise ValueError(
                    f"JIII {entry['name']!r} references unknown wing {wing!r}"
                )
            j3 = J3(
                name=entry["name"],
                group_number=entry["group_number"],
                position_id=entry.get("position_id"),
                uh_id=entry.get("uh_id"),
                supervisor_id=sup.id,
            )
            db.add(j3)
            group_to_j3[entry["group_number"]] = j3
        db.flush()  # populate j3.id

        # 3) JIIs (Janitor IIs).
        skipped: list[dict] = []
        for entry in data["j2s"]:
            grp = entry.get("group_number")
            j3 = group_to_j3.get(grp) if grp is not None else None
            if j3 is None:
                skipped.append(entry)
                continue
            cust = Custodian(
                first_name=entry["first_name"],
                last_name=entry["last_name"],
                uh_id=entry.get("uh_id"),
                position_id=entry.get("position_id"),
                position_title="Janitor II",
                j3_id=j3.id,
                hire_date=_parse_date(entry.get("hire_date")),
                is_active=True,
            )
            db.add(cust)

        db.commit()

        n_sup = db.query(Supervisor).count()
        n_j3 = db.query(J3).count()
        n_cust = db.query(Custodian).count()
        print(f"Seeded {n_sup} SIIs, {n_j3} JIIIs, {n_cust} JIIs.")

        _upsert_seed_buildings(db)

        # Link Shidler to all Janitor IIs in work group 4 (Jason Tanaka).
        sh = db.query(Building).filter(Building.building_code == "SHIDLER").first()
        j4 = db.query(J3).filter(J3.group_number == 4).first()
        if sh is not None and j4 is not None:
            group4_cust = (
                db.query(Custodian)
                .filter(Custodian.j3_id == j4.id, Custodian.is_active.is_(True))
                .order_by(Custodian.last_name, Custodian.first_name)
                .all()
            )
            sh.custodians.clear()
            sh.custodians.extend(group4_cust)
            db.flush()
            rot = (
                db.query(BuildingPartitionRotation)
                .filter(
                    BuildingPartitionRotation.building_id == sh.id,
                    BuildingPartitionRotation.j3_id == j4.id,
                )
                .first()
            )
            if rot is None:
                db.add(
                    BuildingPartitionRotation(
                        building_id=sh.id,
                        j3_id=j4.id,
                        anchor_date=date(2026, 1, 1),
                    )
                )
            db.commit()
            print(
                f"Linked Shidler to {len(group4_cust)} Group 4 custodian(s); "
                "partition rotation anchor set if missing."
            )

        if skipped:
            print(
                f"Skipped {len(skipped)} JII row(s) without a known group: "
                + ", ".join(f"{s['first_name']} {s['last_name']}" for s in skipped[:5])
                + (" ..." if len(skipped) > 5 else "")
            )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
