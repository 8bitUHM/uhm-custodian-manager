from sqlalchemy.orm import Session
from typing import List, Optional
from models import Custodian, Building, Task, TaskStatus, Supervisor, J3
from schemas import CustodianCreate, BuildingCreate, TaskCreate, SupervisorCreate, J3Create

# J3

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
