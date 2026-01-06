from psycopg2 import ProgrammingError, DataError
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Supervisor, J3, Custodian, Task, Building
from datetime import date

# Hire Dates
dt_1 = date(2022, 6, 11)
dt_2 = date(2020, 1, 25)
dt_3 = date(2023, 11, 12)
def seed():
    db: Session = SessionLocal()

    # clears in case test data exists
    db.query
    db.query(J3).delete()
    db.query(Supervisor).delete()
    db.query(Building).delete()
    db.query(Custodian).delete()
    db.query(Task).delete()
    db.commit()

    # creates the supervisors
    super1 = Supervisor(
        id=1,
        name="Angel Asuncion"
    )
    super2 = Supervisor(
        id=2, 
        name="Aaron Komori"
    )

    # creates J3's
    j3_1 = J3(
        id=101, 
        name="Robert Yamashiro", 
        supervisor=super1
    )
    j3_2 = J3(
        id=102, 
        name="Howard Kahue", 
        supervisor=super1
    )
    j3_3 = J3(
        id=103, 
        name="Edward Abo", 
        supervisor=super2
    )

    # create custodians
    c_1 = Custodian(
        id=111,
        first_name='Cris',
        last_name='Wright',
        email='cwright@hawaii.edu',
        employee_id='j111',
        hire_date= dt_1
    )

    c_2 = Custodian(
        id=112,
        first_name='Iwa',
        last_name='Lani',
        email='ilani@hawaii.edu',
        employee_id='j112',
        hire_date=dt_2
    )

    c_3 = Custodian(
        id=113,
        first_name='Robert',
        last_name='Longekit',
        email='rlongekit@hawaii.edu',
        employee_id='j113',
        hire_date=dt_3
    )

    # Create Building

    bldg_1 = Building(
        id=1,
        name='Kuykendall Hall',
        address='1733 Donagho Road, Honolulu, HI 96822',
        building_code='kuy',
        floors=8,
    )

    bldg_2 = Building(
        id=2,
        name='Pacific Ocean Science & Technology',
        address='1680 East-West Road, Honolulu, HI 96822',
        building_code='post',
        floors=11
    )

    bldg_3 = Building(
        id=3,
        name='Campus Center',
        address='2465 Campus Road, Honolulu, HI 96822',
        building_code='cc',
        floors=3
    )

    # Create Tasks

    t_1 = Task(
        id=1,
        title='fix urinal KUY',
        description="Students reported that the urinal at floor 3 (boy's restroom) is broken",
        priority='high',
        scheduled_date=date(2026,1,12)
    )

    t_2 = Task(
        id=2,
        title='clean spill in Campus Center',
        priority='low',
        assigned_to=112,
        building_id=3,
        scheduled_date=date(2026, 4, 5)
    )

    t_3 = Task(
        id=3,
        title='deliver cables to POST 314',
        description='ICS department is asking if we can deliver cables to 314 before the first class starts',
        assigned_to=111,
        building_id=2,
        scheduled_date=date(2026,10,6)
    )

    
    print('Adding J3s and Supervisors')
    db.add_all([j3_1, j3_2, j3_3, super1, super2])
    
    print('Adding Custodians')
    db.add_all([c_1, c_2, c_3])

    print('Adding Buildings')
    db.add_all([bldg_1, bldg_2, bldg_3])

    print('Adding Tasks')
    db.add_all([t_1, t_2, t_3])
    db.commit()
    db.flush()
    db.close()
    print("Test data added")


if __name__ == "__main__":
    try:
        seed()
    # DBAPI Reference: https://peps.python.org/pep-0249/#exceptions
    # This types of errors and exception depends on the db and it's type (i.e postgres, sqlite)
    except DataError:
        # DataError refers to processed data issues i.e divide by 0 error or num is out of range
        print('Data in field(s) do not match the type')
    except ProgrammingError:
        # ProgrammingError occurs when there is a bug in code i.e reference a table that doesn't exist
        print('ProgrammingError occured')