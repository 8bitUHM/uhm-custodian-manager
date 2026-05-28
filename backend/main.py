import json
from datetime import date

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db, engine
from models import Base, Custodian, Building, BuildingPartition, Task, Supervisor, J3
from schemas import (
    CustodianCreate,
    CustodianUpdate,
    CustodianResponse,
    CustodianListResponse,
    BuildingCreate,
    BuildingCreateBody,
    BuildingUpdate,
    BuildingSummaryResponse,
    BuildingDetailResponse,
    BuildingCustodianBrief,
    TaskCreate,
    TaskResponse,
    SupervisorCreate,
    SupervisorUpdate,
    SupervisorResponse,
    J3Create,
    J3Update,
    J3Response,
    BuildingPartitionCreate,
    BuildingPartitionUpdate,
    BuildingPartitionResponse,
    PartitionRotationUpsert,
    PartitionRotationResponse,
    PartitionRotationStateResponse,
    PartitionScheduleResponse,
    PartitionScheduleRow,
    PartitionScheduleCustodian,
    CleaningSpaceTypeResponse,
    CleaningSpaceTypeUpdate,
    CleaningSpaceTypeCreate,
    CleaningSettingsResponse,
    CleaningSettingsUpdate,
    SpaceTypeMappingResponse,
    SpaceTypeMappingCreate,
    SpaceTypeMappingUpdate,
    BuildingWorkloadResponse,
    WorkloadBreakdownRow,
    UnmappedSpaceSampleResponse,
    WorkloadSummaryRow,
    AimImportResponse,
)
from crud import (
    create_custodian,
    get_custodians,
    get_custodian,
    update_custodian,
    delete_custodian,
    count_custodians,
    create_building,
    get_buildings,
    get_building,
    update_building,
    custodian_counts_by_building,
    create_task,
    get_tasks,
    get_task,
    create_supervisor,
    get_supervisors,
    get_supervisor,
    update_supervisor,
    delete_supervisor,
    create_j3,
    get_j3s,
    get_j3,
    update_j3,
    delete_j3,
    list_building_partitions,
    create_building_partition,
    get_partition,
    update_building_partition,
    delete_building_partition,
    get_partition_rotation,
    upsert_partition_rotation,
    partition_schedule_rows,
    list_cleaning_space_types,
    get_cleaning_space_type,
    create_cleaning_space_type,
    update_cleaning_space_type,
    get_cleaning_settings,
    update_cleaning_settings,
    list_space_type_mappings,
    get_space_type_mapping,
    create_space_type_mapping,
    update_space_type_mapping,
    delete_space_type_mapping,
)
from aim_import import import_aim_for_building
from workload import compute_building_workload, recompute_space_minutes_for_building
from models import CleaningSpaceType, SpaceTypeMapping

# Create database tables
Base.metadata.create_all(bind=engine)


def _custodian_to_response(c: Custodian) -> CustodianResponse:
    return CustodianResponse(
        id=c.id,
        first_name=c.first_name,
        last_name=c.last_name,
        email=c.email,
        phone=c.phone,
        employee_id=c.employee_id,
        uh_id=c.uh_id,
        position_id=c.position_id,
        position_title=c.position_title,
        j3_id=c.j3_id,
        is_active=c.is_active,
        hire_date=c.hire_date,
        created_at=c.created_at,
        updated_at=c.updated_at,
        building_ids=[b.id for b in (getattr(c, "buildings", None) or [])],
    )


def _building_to_detail(b: Building) -> BuildingDetailResponse:
    custs = sorted(
        b.custodians or [],
        key=lambda x: (x.last_name or "", x.first_name or ""),
    )
    return BuildingDetailResponse(
        id=b.id,
        name=b.name,
        address=b.address,
        building_code=b.building_code,
        floors=b.floors,
        description=b.description,
        public_slug=b.public_slug,
        is_active=b.is_active,
        created_at=b.created_at,
        updated_at=b.updated_at,
        custodians=[
            BuildingCustodianBrief(
                id=c.id,
                first_name=c.first_name,
                last_name=c.last_name,
                j3_id=c.j3_id,
                is_active=c.is_active,
            )
            for c in custs
        ],
    )


def _partition_to_response(p: BuildingPartition) -> BuildingPartitionResponse:
    return BuildingPartitionResponse(
        id=p.id,
        building_id=p.building_id,
        floor_id=p.floor_id,
        name=p.name,
        sort_order=p.sort_order,
        geometry=json.loads(p.geometry),
        fill_color=p.fill_color,
    )


def _building_to_summary(b: Building, custodian_count: int) -> BuildingSummaryResponse:
    return BuildingSummaryResponse(
        id=b.id,
        name=b.name,
        address=b.address,
        building_code=b.building_code,
        floors=b.floors,
        description=b.description,
        public_slug=b.public_slug,
        is_active=b.is_active,
        custodian_count=custodian_count,
        created_at=b.created_at,
        updated_at=b.updated_at,
    )


app = FastAPI(
    title="Custodian Manager API",
    description="API for managing custodians, buildings, and tasks",
    version="1.0.0",
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


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    total_custodians = db.query(Custodian).count()
    active_custodians = db.query(Custodian).filter(Custodian.is_active == True).count()
    total_buildings = db.query(Building).count()
    tasks_completed = db.query(Task).filter(Task.status == "completed").count()
    total_supervisors = db.query(Supervisor).count()
    total_j3s = db.query(J3).count()

    return {
        "totalCustodians": total_custodians,
        "activeCustodians": active_custodians,
        "totalBuildings": total_buildings,
        "tasksCompleted": tasks_completed,
        "totalSupervisors": total_supervisors,
        "totalJ3s": total_j3s,
    }


# ---------------------------------------------------------------------------
# Custodian endpoints
# ---------------------------------------------------------------------------
@app.post("/api/custodians/", response_model=CustodianResponse)
async def create_custodian_endpoint(
    custodian: CustodianCreate, db: Session = Depends(get_db)
):
    created = create_custodian(db=db, custodian=custodian)
    return _custodian_to_response(created)


@app.get("/api/custodians/", response_model=CustodianListResponse)
async def get_custodians_endpoint(
    skip: int = 0,
    limit: int = 500,
    wing: Optional[str] = None,
    j3_id: Optional[int] = None,
    q: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    items = get_custodians(
        db, skip=skip, limit=limit, wing=wing, j3_id=j3_id, q=q, is_active=is_active
    )
    total = count_custodians(db, wing=wing, j3_id=j3_id, q=q, is_active=is_active)
    return CustodianListResponse(
        items=[_custodian_to_response(c) for c in items],
        total=total,
    )


@app.get("/api/custodians/{custodian_id}", response_model=CustodianResponse)
async def get_custodian_endpoint(custodian_id: int, db: Session = Depends(get_db)):
    custodian = get_custodian(db, custodian_id=custodian_id)
    if custodian is None:
        raise HTTPException(status_code=404, detail="Custodian not found")
    return _custodian_to_response(custodian)


@app.put("/api/custodians/{custodian_id}", response_model=CustodianResponse)
async def update_custodian_endpoint(
    custodian_id: int,
    custodian: CustodianUpdate,
    db: Session = Depends(get_db),
):
    updated = update_custodian(db, custodian_id=custodian_id, custodian_update=custodian)
    if updated is None:
        raise HTTPException(status_code=404, detail="Custodian not found")
    return _custodian_to_response(updated)


@app.delete("/api/custodians/{custodian_id}")
async def delete_custodian_endpoint(custodian_id: int, db: Session = Depends(get_db)):
    deleted = delete_custodian(db, custodian_id=custodian_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Custodian not found")
    return {"ok": True, "id": custodian_id}


# ---------------------------------------------------------------------------
# J3 (Janitor III) endpoints
# ---------------------------------------------------------------------------
@app.post("/api/j3s/", response_model=J3Response)
async def create_j3_endpoint(j3: J3Create, db: Session = Depends(get_db)):
    return create_j3(db=db, j3=j3)


@app.get("/api/j3s/", response_model=List[J3Response])
async def get_j3s_endpoint(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    return get_j3s(db, skip=skip, limit=limit)


@app.get("/api/j3s/{j3_id}", response_model=J3Response)
async def get_j3_endpoint(j3_id: int, db: Session = Depends(get_db)):
    j3 = get_j3(db, j3_id=j3_id)
    if j3 is None:
        raise HTTPException(status_code=404, detail="J3 not found")
    return j3


@app.put("/api/j3s/{j3_id}", response_model=J3Response)
async def update_j3_endpoint(
    j3_id: int, j3: J3Update, db: Session = Depends(get_db)
):
    updated = update_j3(db, j3_id=j3_id, j3_update=j3)
    if updated is None:
        raise HTTPException(status_code=404, detail="J3 not found")
    return updated


@app.delete("/api/j3s/{j3_id}")
async def delete_j3_endpoint(j3_id: int, db: Session = Depends(get_db)):
    deleted = delete_j3(db, j3_id=j3_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="J3 not found")
    return {"ok": True, "id": j3_id}


# ---------------------------------------------------------------------------
# Supervisor endpoints
# ---------------------------------------------------------------------------
def _supervisor_to_response(supervisor) -> SupervisorResponse:
    return SupervisorResponse(
        id=supervisor.id,
        name=supervisor.name,
        wing=supervisor.wing,
        org_code=supervisor.org_code,
        position_id=supervisor.position_id,
        uh_id=supervisor.uh_id,
        j3_list=[j3.id for j3 in supervisor.j3list],
    )


@app.post("/api/supervisors/", response_model=SupervisorResponse)
async def create_supervisor_endpoint(
    supervisor: SupervisorCreate, db: Session = Depends(get_db)
):
    created = create_supervisor(db=db, supervisor=supervisor)
    return _supervisor_to_response(created)


@app.get("/api/supervisors/", response_model=List[SupervisorResponse])
async def get_supervisors_endpoint(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    supervisors = get_supervisors(db, skip=skip, limit=limit)
    return [_supervisor_to_response(s) for s in supervisors]


@app.get("/api/supervisors/{supervisor_id}", response_model=SupervisorResponse)
async def get_supervisor_endpoint(supervisor_id: int, db: Session = Depends(get_db)):
    supervisor = get_supervisor(db, supervisor_id=supervisor_id)
    if supervisor is None:
        raise HTTPException(status_code=404, detail="Supervisor not found")
    return _supervisor_to_response(supervisor)


@app.put("/api/supervisors/{supervisor_id}", response_model=SupervisorResponse)
async def update_supervisor_endpoint(
    supervisor_id: int,
    supervisor: SupervisorUpdate,
    db: Session = Depends(get_db),
):
    updated = update_supervisor(db, supervisor_id=supervisor_id, supervisor_update=supervisor)
    if updated is None:
        raise HTTPException(status_code=404, detail="Supervisor not found")
    return _supervisor_to_response(updated)


@app.delete("/api/supervisors/{supervisor_id}")
async def delete_supervisor_endpoint(
    supervisor_id: int, db: Session = Depends(get_db)
):
    deleted = delete_supervisor(db, supervisor_id=supervisor_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Supervisor not found")
    return {"ok": True, "id": supervisor_id}


# ---------------------------------------------------------------------------
# Building endpoints
# ---------------------------------------------------------------------------
@app.post("/api/buildings/", response_model=BuildingDetailResponse)
async def create_building_endpoint(
    body: BuildingCreateBody, db: Session = Depends(get_db)
):
    payload = body.dict(exclude={"custodian_ids"})
    created = create_building(
        db=db,
        building=BuildingCreate(**payload),
        custodian_ids=body.custodian_ids,
    )
    b = get_building(db, building_id=created.id)
    assert b is not None
    return _building_to_detail(b)


@app.get("/api/buildings/", response_model=List[BuildingSummaryResponse])
async def get_buildings_endpoint(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    buildings = get_buildings(db, skip=skip, limit=limit)
    counts = custodian_counts_by_building(db)
    return [
        _building_to_summary(b, counts.get(b.id, 0)) for b in buildings
    ]


@app.get("/api/buildings/{building_id}", response_model=BuildingDetailResponse)
async def get_building_endpoint(building_id: int, db: Session = Depends(get_db)):
    building = get_building(db, building_id=building_id)
    if building is None:
        raise HTTPException(status_code=404, detail="Building not found")
    return _building_to_detail(building)


@app.put("/api/buildings/{building_id}", response_model=BuildingDetailResponse)
async def update_building_endpoint(
    building_id: int,
    body: BuildingUpdate,
    db: Session = Depends(get_db),
):
    updated = update_building(db, building_id=building_id, building_update=body)
    if updated is None:
        raise HTTPException(status_code=404, detail="Building not found")
    return _building_to_detail(updated)


# ---------------------------------------------------------------------------
# Building partitions & rotation
# ---------------------------------------------------------------------------
@app.get(
    "/api/buildings/{building_id}/partitions",
    response_model=List[BuildingPartitionResponse],
)
async def list_partitions_endpoint(
    building_id: int,
    floor_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if get_building(db, building_id) is None:
        raise HTTPException(status_code=404, detail="Building not found")
    parts = list_building_partitions(db, building_id, floor_id=floor_id)
    return [_partition_to_response(p) for p in parts]


@app.post(
    "/api/buildings/{building_id}/partitions",
    response_model=BuildingPartitionResponse,
)
async def create_partition_endpoint(
    building_id: int,
    body: BuildingPartitionCreate,
    db: Session = Depends(get_db),
):
    if get_building(db, building_id) is None:
        raise HTTPException(status_code=404, detail="Building not found")
    row = create_building_partition(db, building_id, body)
    return _partition_to_response(row)


@app.put(
    "/api/partitions/{partition_id}",
    response_model=BuildingPartitionResponse,
)
async def update_partition_endpoint(
    partition_id: int,
    body: BuildingPartitionUpdate,
    db: Session = Depends(get_db),
):
    row = update_building_partition(db, partition_id, body)
    if row is None:
        raise HTTPException(status_code=404, detail="Partition not found")
    return _partition_to_response(row)


@app.delete("/api/partitions/{partition_id}")
async def delete_partition_endpoint(partition_id: int, db: Session = Depends(get_db)):
    row = delete_building_partition(db, partition_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Partition not found")
    return {"ok": True, "id": partition_id}


@app.get(
    "/api/buildings/{building_id}/partition-rotation",
    response_model=PartitionRotationStateResponse,
)
async def get_partition_rotation_endpoint(
    building_id: int,
    j3_id: int,
    db: Session = Depends(get_db),
):
    if get_building(db, building_id) is None:
        raise HTTPException(status_code=404, detail="Building not found")
    if get_j3(db, j3_id) is None:
        raise HTTPException(status_code=404, detail="JIII not found")
    row = get_partition_rotation(db, building_id, j3_id)
    return PartitionRotationStateResponse(
        building_id=building_id,
        j3_id=j3_id,
        anchor_date=row.anchor_date if row else None,
    )


@app.put(
    "/api/buildings/{building_id}/partition-rotation",
    response_model=PartitionRotationResponse,
)
async def upsert_partition_rotation_endpoint(
    building_id: int,
    body: PartitionRotationUpsert,
    db: Session = Depends(get_db),
):
    if get_building(db, building_id) is None:
        raise HTTPException(status_code=404, detail="Building not found")
    if get_j3(db, body.j3_id) is None:
        raise HTTPException(status_code=404, detail="JIII not found")
    row = upsert_partition_rotation(
        db, building_id, body.j3_id, body.anchor_date
    )
    return PartitionRotationResponse(
        building_id=row.building_id,
        j3_id=row.j3_id,
        anchor_date=row.anchor_date,
    )


@app.get(
    "/api/buildings/{building_id}/partition-schedule",
    response_model=PartitionScheduleResponse,
)
async def partition_schedule_endpoint(
    building_id: int,
    j3_id: int,
    schedule_date: date,
    floor_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if get_building(db, building_id) is None:
        raise HTTPException(status_code=404, detail="Building not found")
    if get_j3(db, j3_id) is None:
        raise HTTPException(status_code=404, detail="JIII not found")
    rows, anchor, day_off, n_p, n_c = partition_schedule_rows(
        db, building_id, j3_id, schedule_date, floor_id=floor_id
    )
    assignments: List[PartitionScheduleRow] = []
    for part, cust in rows:
        assignments.append(
            PartitionScheduleRow(
                partition=_partition_to_response(part),
                custodian=(
                    PartitionScheduleCustodian(
                        id=cust.id,
                        first_name=cust.first_name,
                        last_name=cust.last_name,
                    )
                    if cust is not None
                    else None
                ),
            )
        )
    return PartitionScheduleResponse(
        building_id=building_id,
        j3_id=j3_id,
        schedule_date=schedule_date,
        floor_id=floor_id,
        anchor_date=anchor,
        day_offset=day_off,
        partition_count=n_p,
        pool_count=n_c,
        assignments=assignments,
    )


# ---------------------------------------------------------------------------
# Cleaning standards & workload
# ---------------------------------------------------------------------------
def _mapping_to_response(m: SpaceTypeMapping) -> SpaceTypeMappingResponse:
    st = m.cleaning_space_type
    return SpaceTypeMappingResponse(
        id=m.id,
        cleaning_space_type_id=m.cleaning_space_type_id,
        cleaning_space_type_slug=st.slug if st else None,
        cleaning_space_type_label=st.label if st else None,
        match_field=m.match_field,
        match_kind=m.match_kind,
        match_value=m.match_value,
        priority=m.priority,
        is_active=m.is_active,
    )


def _workload_to_response(db: Session, building_id: int) -> BuildingWorkloadResponse:
    b = get_building(db, building_id)
    wl = compute_building_workload(db, building_id)
    return BuildingWorkloadResponse(
        building_id=wl.building_id,
        building_name=b.name if b else None,
        building_code=b.building_code if b else None,
        total_minutes=wl.total_minutes,
        workday_minutes=wl.workday_minutes,
        recommended_headcount=wl.recommended_headcount,
        imported_space_count=wl.imported_space_count,
        last_import_at=wl.last_import_at,
        by_space_type=[
            WorkloadBreakdownRow(
                space_type_id=r.space_type_id,
                slug=r.slug,
                label=r.label,
                count=r.count,
                minutes=round(r.minutes, 2),
            )
            for r in wl.by_space_type
        ],
        unmapped_samples=[
            UnmappedSpaceSampleResponse(
                location_code=u.location_code,
                description=u.description,
                effective_sqft=u.effective_sqft,
                minutes=u.minutes,
            )
            for u in wl.unmapped_samples
        ],
    )


@app.get("/api/cleaning-standards/types", response_model=List[CleaningSpaceTypeResponse])
async def list_cleaning_types_endpoint(db: Session = Depends(get_db)):
    return list_cleaning_space_types(db)


@app.post("/api/cleaning-standards/types", response_model=CleaningSpaceTypeResponse)
async def create_cleaning_type_endpoint(
    body: CleaningSpaceTypeCreate, db: Session = Depends(get_db)
):
    existing = (
        db.query(CleaningSpaceType)
        .filter(CleaningSpaceType.slug == body.slug)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    return create_cleaning_space_type(
        db,
        slug=body.slug,
        label=body.label,
        minutes_per_unit=body.minutes_per_unit,
        unit=body.unit,
        sort_order=body.sort_order,
    )


@app.put(
    "/api/cleaning-standards/types/{type_id}",
    response_model=CleaningSpaceTypeResponse,
)
async def update_cleaning_type_endpoint(
    type_id: int,
    body: CleaningSpaceTypeUpdate,
    db: Session = Depends(get_db),
):
    row = update_cleaning_space_type(
        db,
        type_id,
        label=body.label,
        minutes_per_unit=body.minutes_per_unit,
        unit=body.unit,
        is_active=body.is_active,
        sort_order=body.sort_order,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Space type not found")
    recompute_all_buildings_with_spaces(db)
    return row


@app.get("/api/cleaning-standards/settings", response_model=CleaningSettingsResponse)
async def get_cleaning_settings_endpoint(db: Session = Depends(get_db)):
    s = get_cleaning_settings(db)
    return CleaningSettingsResponse(
        workday_minutes=s.workday_minutes,
        sqft_preference=s.sqft_preference,
    )


@app.put("/api/cleaning-standards/settings", response_model=CleaningSettingsResponse)
async def update_cleaning_settings_endpoint(
    body: CleaningSettingsUpdate, db: Session = Depends(get_db)
):
    s = update_cleaning_settings(
        db,
        workday_minutes=body.workday_minutes,
        sqft_preference=body.sqft_preference,
    )
    recompute_all_buildings_with_spaces(db)
    return CleaningSettingsResponse(
        workday_minutes=s.workday_minutes,
        sqft_preference=s.sqft_preference,
    )


@app.get(
    "/api/cleaning-standards/mappings",
    response_model=List[SpaceTypeMappingResponse],
)
async def list_mappings_endpoint(db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload

    rows = (
        db.query(SpaceTypeMapping)
        .options(joinedload(SpaceTypeMapping.cleaning_space_type))
        .order_by(SpaceTypeMapping.priority.desc(), SpaceTypeMapping.id)
        .all()
    )
    return [_mapping_to_response(m) for m in rows]


@app.post(
    "/api/cleaning-standards/mappings",
    response_model=SpaceTypeMappingResponse,
)
async def create_mapping_endpoint(
    body: SpaceTypeMappingCreate, db: Session = Depends(get_db)
):
    if get_cleaning_space_type(db, body.cleaning_space_type_id) is None:
        raise HTTPException(status_code=404, detail="Space type not found")
    row = create_space_type_mapping(db, **body.model_dump())
    from sqlalchemy.orm import joinedload

    row = (
        db.query(SpaceTypeMapping)
        .options(joinedload(SpaceTypeMapping.cleaning_space_type))
        .filter(SpaceTypeMapping.id == row.id)
        .first()
    )
    recompute_all_buildings_with_spaces(db)
    return _mapping_to_response(row)


@app.put(
    "/api/cleaning-standards/mappings/{mapping_id}",
    response_model=SpaceTypeMappingResponse,
)
async def update_mapping_endpoint(
    mapping_id: int,
    body: SpaceTypeMappingUpdate,
    db: Session = Depends(get_db),
):
    data = body.model_dump(exclude_unset=True)
    if "cleaning_space_type_id" in data and data["cleaning_space_type_id"] is not None:
        if get_cleaning_space_type(db, data["cleaning_space_type_id"]) is None:
            raise HTTPException(status_code=404, detail="Space type not found")
    row = update_space_type_mapping(db, mapping_id, **data)
    if row is None:
        raise HTTPException(status_code=404, detail="Mapping not found")
    from sqlalchemy.orm import joinedload

    row = (
        db.query(SpaceTypeMapping)
        .options(joinedload(SpaceTypeMapping.cleaning_space_type))
        .filter(SpaceTypeMapping.id == mapping_id)
        .first()
    )
    recompute_all_buildings_with_spaces(db)
    return _mapping_to_response(row)


@app.delete("/api/cleaning-standards/mappings/{mapping_id}")
async def delete_mapping_endpoint(mapping_id: int, db: Session = Depends(get_db)):
    if not delete_space_type_mapping(db, mapping_id):
        raise HTTPException(status_code=404, detail="Mapping not found")
    recompute_all_buildings_with_spaces(db)
    return {"ok": True, "id": mapping_id}


def recompute_all_buildings_with_spaces(db: Session) -> None:
    from models import BuildingSpace

    building_ids = [
        r[0]
        for r in db.query(BuildingSpace.building_id).distinct().all()
    ]
    for bid in building_ids:
        recompute_space_minutes_for_building(db, bid)


@app.post(
    "/api/buildings/{building_id}/spaces/import",
    response_model=AimImportResponse,
)
async def import_spaces_endpoint(
    building_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if get_building(db, building_id) is None:
        raise HTTPException(status_code=404, detail="Building not found")
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Upload an Excel .xlsx file")
    content = await file.read()
    try:
        from io import BytesIO

        result = import_aim_for_building(db, building_id, BytesIO(content))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {e}") from e
    return AimImportResponse(**result)


@app.get(
    "/api/buildings/{building_id}/workload",
    response_model=BuildingWorkloadResponse,
)
async def building_workload_endpoint(building_id: int, db: Session = Depends(get_db)):
    if get_building(db, building_id) is None:
        raise HTTPException(status_code=404, detail="Building not found")
    return _workload_to_response(db, building_id)


@app.post("/api/buildings/{building_id}/workload/recompute")
async def recompute_workload_endpoint(building_id: int, db: Session = Depends(get_db)):
    if get_building(db, building_id) is None:
        raise HTTPException(status_code=404, detail="Building not found")
    count = recompute_space_minutes_for_building(db, building_id)
    return {"building_id": building_id, "spaces_updated": count}


@app.get("/api/workload/summary", response_model=List[WorkloadSummaryRow])
async def workload_summary_endpoint(db: Session = Depends(get_db)):
    buildings = get_buildings(db)
    rows: List[WorkloadSummaryRow] = []
    for b in buildings:
        wl = compute_building_workload(db, b.id)
        rows.append(
            WorkloadSummaryRow(
                building_id=b.id,
                building_name=b.name,
                building_code=b.building_code,
                public_slug=b.public_slug,
                imported_space_count=wl.imported_space_count,
                total_minutes=wl.total_minutes,
                recommended_headcount=wl.recommended_headcount,
                last_import_at=wl.last_import_at,
            )
        )
    return rows


# ---------------------------------------------------------------------------
# Task endpoints (unchanged)
# ---------------------------------------------------------------------------
@app.post("/api/tasks/", response_model=TaskResponse)
async def create_task_endpoint(task: TaskCreate, db: Session = Depends(get_db)):
    return create_task(db=db, task=task)


@app.get("/api/tasks/", response_model=List[TaskResponse])
async def get_tasks_endpoint(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    return get_tasks(db, skip=skip, limit=limit)


@app.get("/api/tasks/{task_id}", response_model=TaskResponse)
async def get_task_endpoint(task_id: int, db: Session = Depends(get_db)):
    task = get_task(db, task_id=task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
