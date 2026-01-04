from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os

from database import get_db, engine
from models import Base
from schemas import CustodianCreate, CustodianResponse, BuildingCreate, BuildingResponse, TaskCreate, TaskResponse, SupervisorCreate, SupervisorResponse, J3Create, J3Response, J2Create, J2Response
from crud import (
    create_custodian, get_custodians, get_custodian,
    create_building, get_buildings, get_building,
    create_task, get_tasks, get_task,
    create_supervisor, get_supervisors, get_supervisor,
    create_j3, get_j3s, get_j3,
    create_j2, get_j2s, get_j2
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

# j2 endpoints
@app.post("/api/j2s/", response_model=J2Response)
async def create_j2_endpoint(j2: J2Create, db: Session = Depends(get_db)):
    return create_j2(db=db, j2=j2)

@app.get("/api/j2s/", response_model=List[J2Response])
async def get_j2s_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    j2s = get_j2s(db, skip=skip, limit=limit)
    return (
        J2Response(
            id=j2.id,
            name=j2.name,
            j3_name=j2.j3.name,
        )
        for j2 in j2s
    )

@app.get("/api/j2s/{j2_id}", response_model=J2Response)
async def get_j2s_endpoint(j2_id: int, db: Session = Depends(get_db)):
    j2 = get_j2(db, j2_id=j2_id)
    if j2 is None:
        raise HTTPException(status_code=404, detail="J2 not found")
    return J2Response(
        id=j2.id, 
        name=j2.name, 
        j3_name=j2.j3.name,
    )

# j3 endpoints
@app.post("/api/j3s/", response_model=J3Response)
async def create_j3_endpoint(j3: J3Create, db: Session = Depends(get_db)):
    return create_j3(db=db, j3=j3)

@app.get("/api/j3s/", response_model=List[J3Response])
async def get_j3s_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    j3s = get_j3s(db, skip=skip, limit=limit)
    return (
        J3Response(
            id=j3.id,
            name=j3.name,
            supervisor_name=j3.supervisor.name,
            j2_list=[j2s.name for j2s in j3.j2list]
        )
        for j3 in j3s
    )

@app.get("/api/j3s/{j3_id}", response_model=J3Response)
async def get_j3s_endpoint(j3_id: int, db: Session = Depends(get_db)):
    j3 = get_j3(db, j3_id=j3_id)
    if j3 is None:
        raise HTTPException(status_code=404, detail="J3 not found")
    return J3Response(
        id=j3.id, 
        name=j3.name, 
        supervisor_name=j3.supervisor.name, 
        j2_list=[j2s.name for j2s in j3.j2list]
    )

# Supervisor endpoints
@app.post("/api/supervisors/", response_model=SupervisorResponse)
async def create_supervisor_endpoint(supervisor: SupervisorCreate, db: Session = Depends(get_db)):
    return create_supervisor(db=db, supervisor=supervisor)

@app.get("/api/supervisors/", response_model=List[SupervisorResponse])
async def get_supervisors_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    supervisors = get_supervisors(db, skip=skip, limit=limit)
    return [
        SupervisorResponse(
            id=supervisor.id,
            name=supervisor.name,
            j3_list=[j3s.name for j3s in supervisor.j3list]
        )
        for supervisor in supervisors
    ]

@app.get("/api/supervisors/{supervisor_id}", response_model=SupervisorResponse)
async def get_supervisors_endpoint(supervisor_id: int, db: Session = Depends(get_db)):
    supervisor = get_supervisor(db, supervisor_id=supervisor_id)
    if supervisor is None:
        raise HTTPException(status_code=404, detail="Supervisor not found")
    return SupervisorResponse(id=supervisor.id, name=supervisor.name, j3_list=[j3s.name for j3s in supervisor.j3list])

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
