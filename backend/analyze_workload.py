"""Print workload breakdown by space type for selected buildings."""
from __future__ import annotations

import math
from collections import defaultdict

from sqlalchemy.orm import joinedload

from database import SessionLocal
from models import Building, BuildingSpace


def main() -> None:
    db = SessionLocal()
    try:
        for code in ["POST", "HAWAII", "LSB"]:
            b = db.query(Building).filter(Building.building_code == code).first()
            if b is None:
                continue
            spaces = (
                db.query(BuildingSpace)
                .options(joinedload(BuildingSpace.cleaning_space_type))
                .filter(BuildingSpace.building_id == b.id)
                .all()
            )
            by_type: dict[str, dict] = defaultdict(
                lambda: {"count": 0, "minutes": 0.0, "label": ""}
            )
            for sp in spaces:
                st = sp.cleaning_space_type
                slug = st.slug if st else "none"
                by_type[slug]["count"] += 1
                by_type[slug]["minutes"] += sp.cleaning_minutes or 0
                by_type[slug]["label"] = st.label if st else "None"
                by_type[slug]["slug"] = slug

            total = sum(s.cleaning_minutes or 0 for s in spaces)
            print(f"\n=== {b.name} ({code}) ===")
            print(f"Total spaces (AiM rows): {len(spaces)}")
            print(f"Total minutes: {total:.0f} ({total / 60:.1f} hours)")
            print(f"Recommended custodians @ 480 min/day: {math.ceil(total / 480)}")
            print("By space type:")
            for slug, d in sorted(by_type.items(), key=lambda x: -x[1]["minutes"]):
                pct = 100 * d["minutes"] / total if total else 0
                print(
                    f"  {d['label']:32} rows={d['count']:4}  "
                    f"min={d['minutes']:8.0f}  ({pct:5.1f}%)"
                )

            # Top descriptions for corridor and office
            for target_slug in ["corridor", "office", "lab"]:
                subset = [
                    s
                    for s in spaces
                    if s.cleaning_space_type and s.cleaning_space_type.slug == target_slug
                ]
                if not subset:
                    continue
                desc_counts: dict[str, int] = defaultdict(int)
                for s in subset:
                    desc_counts[s.description or "(blank)"] += 1
                top = sorted(desc_counts.items(), key=lambda x: -x[1])[:8]
                print(f"  Top '{target_slug}' descriptions:")
                for desc, n in top:
                    print(f"    {n:4}x {desc[:60]}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
