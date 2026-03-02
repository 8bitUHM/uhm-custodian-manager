from pydantic import BaseModel, EmailStr, ValidationInfo, field_validator, model_validator
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
    j3_list: list[int] = []

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

    @field_validator('title', 'description', 'priority', mode='before', check_fields=False)
    @classmethod
    def clean_title(cls, value: str) -> str:
        return value.strip()
    
    @field_validator('priority', mode='before', check_fields=False)
    @classmethod
    def format(cls, value: str) -> str:
        return value.lower()
    
    @field_validator('title', mode='after', check_fields=False)
    @classmethod
    def title_not_empty(cls, info: ValidationInfo) -> str:
        if (info.data['title'].__len__ == 0):
            raise ValueError('Title must be defined!')
        return info.data['title']
    
    @field_validator('scheduled_date', mode='after', check_fields=False)
    @classmethod
    def check_past_date(cls, info: ValidationInfo) -> str:
        current_date = datetime.now()
        if (info.data['scheduled_date'] < current_date):
            raise ValueError('Date has already passed')
        return info.data['scheduled_date']
    
    
    
    

class TaskResponse(TaskBase):
    id: int
    completed_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
