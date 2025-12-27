from sqlalchemy.orm import Session
from typing import List, Optional
from models import Custodian, Building, Task, TaskStatus, Supervisor, J3, J2
from schemas import CustodianCreate, BuildingCreate, TaskCreate, SupervisorCreate, J3Create, J2Create

#J2
def create_j2(db: Session, j2: J2Create):
    db_j2 = J2(**j2.dict())
    db.add(db_j2)
    db.commit()
    db.refresh(db_j2)
    return db_j2

def get_j2(db: Session, j2_id: int):
    return db.query(J2).filter(J2.id == j2_id).first()

def get_j2s(db: Session, skip: int = 0, limit: int = 100):
    return db.query(J2).offset(skip).limit(limit).all()

def update_j2(db: Session, j2_id: int, j2_update: dict):
    db_j2 = db.query(J2).filter(J2.id == j2_id).first()
    if db_j2:
        for key, value in j2_update.items():
            setattr(db_j2, key, value)
        db.commit()
        db.refresh(db_j2)
    return db_j2

def delete_j2(db: Session, j2_id: int):
    db_j2 = db.query(J2).filter(J2.id == j2_id).first()
    if db_j2:
        db.delete(db_j2)
        db.commit()
    return db_j2

# J3
def create_j3(db: Session, j3: J3Create):
    db_j3 = J3(**j3.dict())
    db.add(db_j3)
    db.commit()
    db.refresh(db_j3)
    return db_j3

def get_j3(db: Session, j3_id: int):
    return db.query(J3).filter(J3.id == j3_id).first()

def get_j3s(db: Session, skip: int = 0, limit: int = 100):
    return db.query(J3).offset(skip).limit(limit).all()

def update_j3(db: Session, j3_id: int, j3_update: dict):
    db_j3 = db.query(J3).filter(J3.id == j3_id).first()
    if db_j3:
        for key, value in j3_update.items():
            setattr(db_j3, key, value)
        db.commit()
        db.refresh(db_j3)
    return db_j3

def delete_j3(db: Session, j3_id: int):
    db_j3 = db.query(J3).filter(J3.id == j3_id).first()
    if db_j3:
        db.delete(db_j3)
        db.commit()
    return db_j3

# Supervisor CRUD operations
def create_supervisor(db: Session, supervisor: SupervisorCreate):
    db_supervisor = Supervisor(**supervisor.dict())
    db.add(db_supervisor)
    db.commit()
    db.refresh(db_supervisor)
    return db_supervisor

def get_supervisor(db: Session, supervisor_id: int):
    return db.query(Supervisor).filter(Supervisor.id == supervisor_id).first()

def get_supervisors(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Supervisor).offset(skip).limit(limit).all()

def update_supervisor(db: Session, supervisor_id: int, supervisor_update: dict):
    db_supervisor = db.query(Supervisor).filter(Supervisor.id == supervisor_id).first()
    if db_supervisor:
        for key, value in supervisor_update.items():
            setattr(db_supervisor, key, value)
        db.commit()
        db.refresh(db_supervisor)
    return db_supervisor

def delete_supervisor(db: Session, supervisor_id: int):
    db_supervisor = db.query(Supervisor).filter(Supervisor.id == supervisor_id).first()
    if db_supervisor:
        db.delete(db_supervisor)
        db.commit()
    return db_supervisor

# Custodian CRUD operations
def create_custodian(db: Session, custodian: CustodianCreate):
    db_custodian = Custodian(**custodian.dict())
    db.add(db_custodian)
    db.commit()
    db.refresh(db_custodian)
    return db_custodian

def get_custodian(db: Session, custodian_id: int):
    return db.query(Custodian).filter(Custodian.id == custodian_id).first()

def get_custodians(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Custodian).offset(skip).limit(limit).all()

def update_custodian(db: Session, custodian_id: int, custodian_update: dict):
    db_custodian = db.query(Custodian).filter(Custodian.id == custodian_id).first()
    if db_custodian:
        for key, value in custodian_update.items():
            setattr(db_custodian, key, value)
        db.commit()
        db.refresh(db_custodian)
    return db_custodian

def delete_custodian(db: Session, custodian_id: int):
    db_custodian = db.query(Custodian).filter(Custodian.id == custodian_id).first()
    if db_custodian:
        db.delete(db_custodian)
        db.commit()
    return db_custodian

# Building CRUD operations
def create_building(db: Session, building: BuildingCreate):
    db_building = Building(**building.dict())
    db.add(db_building)
    db.commit()
    db.refresh(db_building)
    return db_building

def get_building(db: Session, building_id: int):
    return db.query(Building).filter(Building.id == building_id).first()

def get_buildings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Building).offset(skip).limit(limit).all()

def update_building(db: Session, building_id: int, building_update: dict):
    db_building = db.query(Building).filter(Building.id == building_id).first()
    if db_building:
        for key, value in building_update.items():
            setattr(db_building, key, value)
        db.commit()
        db.refresh(db_building)
    return db_building

def delete_building(db: Session, building_id: int):
    db_building = db.query(Building).filter(Building.id == building_id).first()
    if db_building:
        db.delete(db_building)
        db.commit()
    return db_building

# Task CRUD operations
def create_task(db: Session, task: TaskCreate):
    db_task = Task(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def get_task(db: Session, task_id: int):
    return db.query(Task).filter(Task.id == task_id).first()

def get_tasks(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Task).offset(skip).limit(limit).all()

def get_tasks_by_custodian(db: Session, custodian_id: int):
    return db.query(Task).filter(Task.assigned_to == custodian_id).all()

def get_tasks_by_building(db: Session, building_id: int):
    return db.query(Task).filter(Task.building_id == building_id).all()

def update_task_status(db: Session, task_id: int, status: TaskStatus):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if db_task:
        db_task.status = status
        if status == TaskStatus.completed:
            from sqlalchemy.sql import func
            db_task.completed_date = func.now()
        db.commit()
        db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if db_task:
        db.delete(db_task)
        db.commit()
    return db_task
