from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import TaskStatus

# Custodian schemas
class CustodianBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    employee_id: Optional[str] = None
    is_active: bool = True

class CustodianCreate(CustodianBase):
    pass

class CustodianResponse(CustodianBase):
    id: int
    hire_date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# J3 schemas
class J3Base(BaseModel):
    id: int
    name: str
    supervisor_id: int

class J3Create(J3Base):
    pass

class J3Response(J3Base):
    class Config:
        from_attributes = True

# Supervisor schemas
class SupervisorBase(BaseModel):
    id: int
    name: str

class SupervisorCreate(SupervisorBase):
    pass

class SupervisorResponse(SupervisorBase):
    j3_list: list["J3Response"] = []

    class Config:
        from_attributes = True

# Building schemas
class BuildingBase(BaseModel):
    name: str
    address: str
    building_code: Optional[str] = None
    floors: Optional[int] = None
    description: Optional[str] = None
    is_active: bool = True

class BuildingCreate(BuildingBase):
    pass

class BuildingResponse(BuildingBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Task schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.pending
    priority: str = "medium"
    assigned_to: Optional[int] = None
    building_id: Optional[int] = None
    scheduled_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: int
    completed_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
