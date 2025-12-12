from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Supervisor, J3

def seed():
    db: Session = SessionLocal()

    # clears in case test data exists
    db.query(J3).delete()
    db.query(Supervisor).delete()
    db.commit()

    # creates the supervisors
    super1 = Supervisor(id=1, name="Angel Asuncion")
    super2 = Supervisor(id=2, name="Aaron Komori")

    db.add_all([super1, super2])
    db.commit()

    # creates J3's
    j3_1 = J3(id=101, name="Robert Yamashiro", supervisor_id=1)
    j3_2 = J3(id=102, name="Howard Kahue", supervisor_id=1)
    j3_3 = J3(id=103, name="Edward Abo", supervisor_id=2)

    db.add_all([j3_1, j3_2, j3_3])
    db.commit()

    db.close()
    print("Test data added")


if __name__ == "__main__":
    seed()