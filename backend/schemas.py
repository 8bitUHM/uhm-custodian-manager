from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from models import TaskStatus
import re

NAME_REGEX = r"^[A-Za-z\s'-]+$"

MIN_ID_NUM = 1_000_000
MAX_ID_NUM = 99_999_999

# J2 schemas
class J2Base(BaseModel):
    id: int = Field(ge=MIN_ID_NUM, le=MAX_ID_NUM)
    name: str
    j3_id: int = Field(ge=MIN_ID_NUM, le=MAX_ID_NUM)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()

        if not v:
            raise ValueError("Name cannot be empty")

        if not re.match(NAME_REGEX, v):
            raise ValueError(
                "Name may only contain letters, spaces, and apostrophes"
            )
        return v

class J2Create(J2Base):
    pass

class J2Response(J2Base):
    class Config:
        from_attributes = True

# J3 schemas
class J3Base(BaseModel):
    id: int = Field(ge=MIN_ID_NUM, le=MAX_ID_NUM)
    name: str
    supervisor_id: int = Field(ge=MIN_ID_NUM, le=MAX_ID_NUM)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()

        if not v:
            raise ValueError("Name cannot be empty")

        if not re.match(NAME_REGEX, v):
            raise ValueError(
                "Name may only contain letters, spaces, and apostrophes"
            )
        return v

class J3Create(J3Base):
    pass

class J3Response(J3Base):
    j2_list: list[int] = []

    class Config:
        from_attributes = True

# Supervisor schemas
class SupervisorBase(BaseModel):
    id: int = Field(ge=MIN_ID_NUM, le=MAX_ID_NUM)
    name: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()

        if not v:
            raise ValueError("Name cannot be empty")

        if not re.match(NAME_REGEX, v):
            raise ValueError(
                "Name may only contain letters, spaces, and apostrophes"
            )
        return v

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
    pass

class TaskResponse(TaskBase):
    id: int
    completed_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True