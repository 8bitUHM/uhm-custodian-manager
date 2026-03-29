from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Supervisor, J3, J2
from datetime import datetime

def hire_date_change(date_str: str):
    return datetime.strptime(date_str, "%d-%b-%y").date()

def seed():
    db: Session = SessionLocal()

    # clears in case test data exists
    db.query(J2).delete()
    db.query(J3).delete()
    db.query(Supervisor).delete()
    db.commit()

    # creates the supervisors
    super1 = Supervisor(
        id=58219374, 
        name="Angel Asuncion"
    )
    super2 = Supervisor(
        id=73946128, 
        name="Aaron Komori"
    )

    # creates J3's
    j3_1 = J3(
        id=81427596, 
        name="Chester Baitlon", 
        supervisor=super1,
        groupnum=14,
        hire_date=hire_date_change("3-Apr-23"),
    )
    j3_2 = J3(
        id=69328417, 
        name="Sandra Chang", 
        supervisor=super1,
        groupnum=10,
        hire_date=hire_date_change("6-May-13")
    )
    j3_3 = J3(
        id=92571648, 
        name="Louis Laurito", 
        supervisor=super2,
        groupnum=11,
        hire_date=hire_date_change("8-Sep-14"),
    )
    j3_4 = J3(
        id=2211111, 
        name="John Marcello", 
        supervisor=super2,
        groupnum=13,
        hire_date=hire_date_change("16-Apr-20"),
    )

    # creates J2's
    j2_1 = J2(
        id=36192745, 
        name="Beverly Abad", 
        j3=j3_1,
        groupnum=14,
        hire_date=hire_date_change("16-Oct-17"),
    )
    j2_2 = J2(
        id=84726139, 
        name="Diana Alcoran", 
        j3=j3_1,
        groupnum=14,
        hire_date=hire_date_change("27-Apr-15"),
    )
    j2_3 = J2(
        id=59283476, 
        name="Louie Aquino", 
        j3=j3_2,
        groupnum=10,
        hire_date=hire_date_change("20-Apr-15"),
    )
    j2_4 = J2(
        id=71639428, 
        name="Lance Belen", 
        j3=j3_2,
        groupnum=10,
        hire_date=hire_date_change("14-Oct-19"),
    )
    j2_5 = J2(
        id=43826197, 
        name="Rebecca Waiwaiole", 
        j3=j3_3,
        groupnum=11,
        hire_date=hire_date_change("3-Mar-00"),
    )
    j2_6 = J2(
        id=96472815, 
        name="Glenn Sato", 
        j3=j3_3,
        groupnum=11,
        hire_date=hire_date_change("16-May-17"),
    )
    j2_7 = J2(
        id=28573964, 
        name="Darren Uehara", 
        j3=j3_4,
        groupnum=13,
        hire_date=hire_date_change("27-Sep-16"),
    )
    j2_8 = J2(
        id=12121212, 
        name="Akira Sharp", 
        j3=j3_4,
        groupnum=16,
        hire_date=hire_date_change("1-Oct-18"),
    )

    # Adds all the data above into the database for testing
    db.add_all([
        super1, super2,
        j3_1, j3_2, j3_3, j3_4,
        j2_1, j2_2, j2_3, j2_4, j2_5, j2_6, j2_7, j2_8
    ])
    db.commit()

    db.close()
    print("Test data added")


if __name__ == "__main__":
    seed()