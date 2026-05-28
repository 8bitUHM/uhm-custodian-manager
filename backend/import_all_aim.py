"""One-off: import AiM xlsx from repo root for all mapped buildings."""
from pathlib import Path

from database import SessionLocal
from models import Building
from aim_import import import_aim_file_path

XLSX = Path(__file__).resolve().parent.parent / (
    "AiM extract for POST1162  MOORE1185 LSB 1263  HAWAII 1002  jalen 26_0508.xlsx"
)

if __name__ == "__main__":
    if not XLSX.exists():
        raise SystemExit(f"File not found: {XLSX}")
    db = SessionLocal()
    try:
        for code in ["POST", "HAWAII", "LSB", "MOORE"]:
            b = db.query(Building).filter(Building.building_code == code).first()
            if b is None:
                print(f"Skip {code}: building not found")
                continue
            r = import_aim_file_path(db, b.id, str(XLSX))
            print(
                f"{code}: imported={r['imported_count']} "
                f"skipped_rows={r['skipped_rows']} "
                f"allowed_props={r['allowed_property_codes']}"
            )
    finally:
        db.close()
