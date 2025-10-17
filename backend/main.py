from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os

from database import get_db, engine
from models import Base
from schemas import CustodianCreate, CustodianResponse, BuildingCreate, BuildingResponse, TaskCreate, TaskResponse
from crud import (
    create_custodian, get_custodians, get_custodian,
    create_building, get_buildings, get_building,
    create_task, get_tasks, get_task
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Custodian Manager API",
    description="API for managing custodians, buildings, and tasks",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Custodian Manager API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Dashboard endpoints
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    from models import Custodian, Building, Task
    
    total_custodians = db.query(Custodian).count()
    active_custodians = db.query(Custodian).filter(Custodian.is_active == True).count()
    total_buildings = db.query(Building).count()
    tasks_completed = db.query(Task).filter(Task.status == "completed").count()
    
    return {
        "totalCustodians": total_custodians,
        "activeCustodians": active_custodians,
        "totalBuildings": total_buildings,
        "tasksCompleted": tasks_completed
    }

# Custodian endpoints
@app.post("/api/custodians/", response_model=CustodianResponse)
async def create_custodian_endpoint(custodian: CustodianCreate, db: Session = Depends(get_db)):
    return create_custodian(db=db, custodian=custodian)

@app.get("/api/custodians/", response_model=List[CustodianResponse])
async def get_custodians_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    custodians = get_custodians(db, skip=skip, limit=limit)
    return custodians

@app.get("/api/custodians/{custodian_id}", response_model=CustodianResponse)
async def get_custodian_endpoint(custodian_id: int, db: Session = Depends(get_db)):
    custodian = get_custodian(db, custodian_id=custodian_id)
    if custodian is None:
        raise HTTPException(status_code=404, detail="Custodian not found")
    return custodian

# Building endpoints
@app.post("/api/buildings/", response_model=BuildingResponse)
async def create_building_endpoint(building: BuildingCreate, db: Session = Depends(get_db)):
    return create_building(db=db, building=building)

@app.get("/api/buildings/", response_model=List[BuildingResponse])
async def get_buildings_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    buildings = get_buildings(db, skip=skip, limit=limit)
    return buildings

@app.get("/api/buildings/{building_id}", response_model=BuildingResponse)
async def get_building_endpoint(building_id: int, db: Session = Depends(get_db)):
    building = get_building(db, building_id=building_id)
    if building is None:
        raise HTTPException(status_code=404, detail="Building not found")
    return building

# Task endpoints
@app.post("/api/tasks/", response_model=TaskResponse)
async def create_task_endpoint(task: TaskCreate, db: Session = Depends(get_db)):
    return create_task(db=db, task=task)

@app.get("/api/tasks/", response_model=List[TaskResponse])
async def get_tasks_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tasks = get_tasks(db, skip=skip, limit=limit)
    return tasks

@app.get("/api/tasks/{task_id}", response_model=TaskResponse)
async def get_task_endpoint(task_id: int, db: Session = Depends(get_db)):
    task = get_task(db, task_id=task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
