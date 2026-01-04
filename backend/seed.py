from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Supervisor, J3, J2

def seed():
    db: Session = SessionLocal()

    # clears in case test data exists
    db.query(J2).delete()
    db.query(J3).delete()
    db.query(Supervisor).delete()
    db.commit()

    # creates the supervisors
    super1 = Supervisor(id=1, name="Angel Asuncion")
    super2 = Supervisor(id=2, name="Aaron Komori")

    # creates J3's
    j3_1 = J3(id=101, name="Robert Yamashiro", supervisor=super1)
    j3_2 = J3(id=102, name="Howard Kahue", supervisor=super1)
    j3_3 = J3(id=103, name="Edward Abo", supervisor=super2)

    db.add_all([j3_1, j3_2, j3_3, j3_4, super1, super2, j2_1, j2_2, j2_3, j2_4, j2_5, j2_6, j2_7, j2_8])
    db.commit()

    db.close()
    print("Test data added")


if __name__ == "__main__":
    seed()