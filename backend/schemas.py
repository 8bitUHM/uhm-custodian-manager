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
# Cleaning standards & workload
# ---------------------------------------------------------------------------
CleaningUnitLiteral = Literal["per_space", "per_sqft"]
MatchFieldLiteral = Literal["description", "primary_type"]
MatchKindLiteral = Literal["exact", "contains", "regex"]


class CleaningSpaceTypeResponse(BaseModel):
    id: int
    slug: str
    label: str
    minutes_per_unit: float
    unit: CleaningUnitLiteral
    is_active: bool
    sort_order: int

    class Config:
        from_attributes = True


class CleaningSpaceTypeUpdate(BaseModel):
    label: Optional[str] = None
    minutes_per_unit: Optional[float] = None
    unit: Optional[CleaningUnitLiteral] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class CleaningSpaceTypeCreate(BaseModel):
    slug: str = Field(..., max_length=80)
    label: str = Field(..., max_length=200)
    minutes_per_unit: float
    unit: CleaningUnitLiteral = "per_space"
    sort_order: int = 0


class CleaningSettingsResponse(BaseModel):
    workday_minutes: int
    sqft_preference: str


class CleaningSettingsUpdate(BaseModel):
    workday_minutes: Optional[int] = Field(None, ge=1, le=24 * 60)
    sqft_preference: Optional[str] = None


class SpaceTypeMappingResponse(BaseModel):
    id: int
    cleaning_space_type_id: int
    cleaning_space_type_slug: Optional[str] = None
    cleaning_space_type_label: Optional[str] = None
    match_field: MatchFieldLiteral
    match_kind: MatchKindLiteral
    match_value: str
    priority: int
    is_active: bool

    class Config:
        from_attributes = True


class SpaceTypeMappingCreate(BaseModel):
    cleaning_space_type_id: int
    match_field: MatchFieldLiteral = "description"
    match_kind: MatchKindLiteral = "contains"
    match_value: str = Field(..., max_length=200)
    priority: int = 0
    is_active: bool = True


class SpaceTypeMappingUpdate(BaseModel):
    cleaning_space_type_id: Optional[int] = None
    match_field: Optional[MatchFieldLiteral] = None
    match_kind: Optional[MatchKindLiteral] = None
    match_value: Optional[str] = Field(None, max_length=200)
    priority: Optional[int] = None
    is_active: Optional[bool] = None


class WorkloadBreakdownRow(BaseModel):
    space_type_id: Optional[int] = None
    slug: str
    label: str
    count: int
    minutes: float


class UnmappedSpaceSampleResponse(BaseModel):
    location_code: str
    description: Optional[str] = None
    effective_sqft: Optional[float] = None
    minutes: float


class BuildingWorkloadResponse(BaseModel):
    building_id: int
    building_name: Optional[str] = None
    building_code: Optional[str] = None
    total_minutes: float
    workday_minutes: int
    recommended_headcount: int
    imported_space_count: int
    last_import_at: Optional[datetime] = None
    by_space_type: List[WorkloadBreakdownRow]
    unmapped_samples: List[UnmappedSpaceSampleResponse]


class WorkloadSummaryRow(BaseModel):
    building_id: int
    building_name: str
    building_code: Optional[str] = None
    public_slug: Optional[str] = None
    imported_space_count: int
    total_minutes: float
    recommended_headcount: int
    last_import_at: Optional[datetime] = None


class AimImportResponse(BaseModel):
    building_id: int
    import_batch_id: str
    imported_count: int
    skipped_rows: int
    skipped_property_codes: List[int]
    allowed_property_codes: List[int]


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
