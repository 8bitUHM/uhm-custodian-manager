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
    j3_1 = J3(id=11, name="Chester Baitlon", supervisor=super1)
    j3_2 = J3(id=12, name="Sandra Chang", supervisor=super1)
    j3_3 = J3(id=21, name="Louis Laurito", supervisor=super2)
    j3_4 = J3(id=22, name="John Marcello", supervisor=super2)

    # creates J2's
    j2_1 = J2(id=111, name="Beverly Abad", j3=j3_1)
    j2_2 = J2(id=112, name="Diana Alcoran", j3=j3_1)
    j2_3 = J2(id=121, name="Louie Aquino", j3=j3_2)
    j2_4 = J2(id=122, name="Lance Belen", j3=j3_2)
    j2_5 = J2(id=211, name="Rebecca Waiwaiole", j3=j3_3)
    j2_6 = J2(id=212, name="Glenn Sato", j3=j3_3)
    j2_7 = J2(id=221, name="Darren Uehara", j3=j3_4)
    j2_8 = J2(id=222, name="Akira Sharp", j3=j3_4)

    db.add_all([j3_1, j3_2, j3_3, j3_4, super1, super2, j2_1, j2_2, j2_3, j2_4, j2_5, j2_6, j2_7, j2_8])
    db.commit()

    db.close()
    print("Test data added")


if __name__ == "__main__":
    seed()