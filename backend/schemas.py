import math

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Any, Literal
from datetime import datetime, date
from models import TaskStatus

# ---------------------------------------------------------------------------
# Custodian (Janitor II)
# ---------------------------------------------------------------------------
class CustodianBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    employee_id: Optional[str] = None
    uh_id: Optional[str] = None
    position_id: Optional[str] = None
    position_title: Optional[str] = "Janitor II"
    j3_id: Optional[int] = None
    is_active: bool = True

class CustodianCreate(CustodianBase):
    pass

class CustodianUpdate(BaseModel):
    """All-optional partial update payload."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    employee_id: Optional[str] = None
    uh_id: Optional[str] = None
    position_id: Optional[str] = None
    position_title: Optional[str] = None
    j3_id: Optional[int] = None
    is_active: Optional[bool] = None
    building_ids: Optional[List[int]] = None

class CustodianResponse(CustodianBase):
    id: int
    hire_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    building_ids: List[int] = []

    class Config:
        from_attributes = True

class CustodianListResponse(BaseModel):
    items: List[CustodianResponse]
    total: int

# ---------------------------------------------------------------------------
# J3 (Janitor III)
# ---------------------------------------------------------------------------
class J3Base(BaseModel):
    name: str
    group_number: Optional[int] = None
    position_id: Optional[str] = None
    uh_id: Optional[str] = None
    supervisor_id: int

class J3Create(J3Base):
    pass

class J3Update(BaseModel):
    name: Optional[str] = None
    group_number: Optional[int] = None
    position_id: Optional[str] = None
    uh_id: Optional[str] = None
    supervisor_id: Optional[int] = None

class J3Response(J3Base):
    id: int

    class Config:
        from_attributes = True

# ---------------------------------------------------------------------------
# Supervisor (Janitor Supervisor II)
# ---------------------------------------------------------------------------
class SupervisorBase(BaseModel):
    name: str
    wing: Optional[str] = None
    org_code: Optional[str] = None
    position_id: Optional[str] = None
    uh_id: Optional[str] = None

class SupervisorCreate(SupervisorBase):
    pass

class SupervisorUpdate(BaseModel):
    name: Optional[str] = None
    wing: Optional[str] = None
    org_code: Optional[str] = None
    position_id: Optional[str] = None
    uh_id: Optional[str] = None

class SupervisorResponse(SupervisorBase):
    id: int
    j3_list: List[int] = []

    class Config:
        from_attributes = True

# ---------------------------------------------------------------------------
# Building
# ---------------------------------------------------------------------------
class BuildingBase(BaseModel):
    name: str
    address: str
    building_code: Optional[str] = None
    floors: Optional[int] = None
    description: Optional[str] = None
    public_slug: Optional[str] = None
    is_active: bool = True

class BuildingCreate(BuildingBase):
    pass

class BuildingCreateBody(BuildingCreate):
    """POST body: building fields plus optional initial custodian links."""
    custodian_ids: Optional[List[int]] = None

class BuildingUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    building_code: Optional[str] = None
    floors: Optional[int] = None
    description: Optional[str] = None
    public_slug: Optional[str] = None
    is_active: Optional[bool] = None
    custodian_ids: Optional[List[int]] = None

class BuildingResponse(BuildingBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BuildingCustodianBrief(BaseModel):
    id: int
    first_name: str
    last_name: str
    j3_id: Optional[int] = None
    is_active: bool = True

    class Config:
        from_attributes = True

class BuildingSummaryResponse(BuildingBase):
    """List row with assignment count."""
    id: int
    custodian_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BuildingDetailResponse(BuildingBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    custodians: List[BuildingCustodianBrief] = []

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Building partitions (SVG-local GeoJSON Polygon coordinates)
# ---------------------------------------------------------------------------
class GeoJSONPolygon(BaseModel):
    """Polygon in building floor SVG user units (not geographic)."""

    type: Literal["Polygon"]
    coordinates: List[List[List[float]]]

    @field_validator("coordinates")
    @classmethod
    def _ring_rules(cls, rings: List[List[List[float]]]) -> List[List[List[float]]]:
        if not rings:
            raise ValueError("Polygon must have at least one ring")
        exterior = rings[0]
        if len(exterior) < 4:
            raise ValueError("Exterior ring must have at least 4 positions (closed)")
        if not (
            math.isclose(exterior[0][0], exterior[-1][0], rel_tol=0.0, abs_tol=1e-4)
            and math.isclose(exterior[0][1], exterior[-1][1], rel_tol=0.0, abs_tol=1e-4)
        ):
            raise ValueError("Exterior ring must be closed (first point equals last)")
        distinct = {tuple(p) for p in exterior[:-1]}
        if len(distinct) < 3:
            raise ValueError("Polygon needs at least 3 distinct vertices")
        for pt in exterior:
            if len(pt) != 2:
                raise ValueError("Each position must be [x, y]")
        return rings


class BuildingPartitionCreate(BaseModel):
    floor_id: str = Field(..., max_length=50)
    name: str = Field(..., max_length=200)
    sort_order: int = 0
    geometry: GeoJSONPolygon
    fill_color: Optional[str] = Field(None, max_length=20)


class BuildingPartitionUpdate(BaseModel):
    floor_id: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=200)
    sort_order: Optional[int] = None
    geometry: Optional[GeoJSONPolygon] = None
    fill_color: Optional[str] = Field(None, max_length=20)


class BuildingPartitionResponse(BaseModel):
    id: int
    building_id: int
    floor_id: str
    name: str
    sort_order: int
    geometry: dict[str, Any]
    fill_color: Optional[str] = None

    class Config:
        from_attributes = True


class PartitionRotationResponse(BaseModel):
    building_id: int
    j3_id: int
    anchor_date: date

    class Config:
        from_attributes = True


class PartitionRotationStateResponse(BaseModel):
    """GET rotation config; anchor_date is null until first PUT."""

    building_id: int
    j3_id: int
    anchor_date: Optional[date] = None


class PartitionRotationUpsert(BaseModel):
    j3_id: int
    anchor_date: date


class PartitionScheduleCustodian(BaseModel):
    id: int
    first_name: str
    last_name: str


class PartitionScheduleRow(BaseModel):
    partition: BuildingPartitionResponse
    custodian: Optional[PartitionScheduleCustodian] = None


class PartitionScheduleResponse(BaseModel):
    building_id: int
    j3_id: int
    schedule_date: date
    floor_id: Optional[str] = None
    anchor_date: Optional[date] = None
    day_offset: Optional[int] = None
    partition_count: int
    pool_count: int
    assignments: List[PartitionScheduleRow]


# ---------------------------------------------------------------------------
# Task
# ---------------------------------------------------------------------------
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
