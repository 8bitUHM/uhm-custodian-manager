from datetime import date

from sqlalchemy.orm import Session, selectinload
from sqlalchemy import or_, func
from typing import List, Optional, Dict, Tuple

from models import (
    Custodian,
    Building,
    Task,
    TaskStatus,
    Supervisor,
    J3,
    custodian_building,
    BuildingPartition,
    BuildingPartitionRotation,
)
from schemas import (
    CustodianCreate,
    CustodianUpdate,
    BuildingCreate,
    BuildingUpdate,
    TaskCreate,
    SupervisorCreate,
    SupervisorUpdate,
    J3Create,
    J3Update,
    BuildingPartitionCreate,
    BuildingPartitionUpdate,
)

# ---------------------------------------------------------------------------
# J3 (Janitor III) CRUD
# ---------------------------------------------------------------------------
def create_j3(db: Session, j3: J3Create):
    db_j3 = J3(**j3.dict())
    db.add(db_j3)
    db.commit()
    db.refresh(db_j3)
    return db_j3

def get_j3(db: Session, j3_id: int):
    return db.query(J3).filter(J3.id == j3_id).first()

def get_j3s(db: Session, skip: int = 0, limit: int = 100):
    return db.query(J3).order_by(J3.group_number).offset(skip).limit(limit).all()

def update_j3(db: Session, j3_id: int, j3_update: J3Update):
    db_j3 = db.query(J3).filter(J3.id == j3_id).first()
    if db_j3:
        for key, value in j3_update.dict(exclude_unset=True).items():
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

# ---------------------------------------------------------------------------
# Supervisor CRUD
# ---------------------------------------------------------------------------
def create_supervisor(db: Session, supervisor: SupervisorCreate):
    db_supervisor = Supervisor(**supervisor.dict())
    db.add(db_supervisor)
    db.commit()
    db.refresh(db_supervisor)
    return db_supervisor

def get_supervisor(db: Session, supervisor_id: int):
    return db.query(Supervisor).filter(Supervisor.id == supervisor_id).first()

def get_supervisors(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Supervisor).order_by(Supervisor.wing).offset(skip).limit(limit).all()

def update_supervisor(db: Session, supervisor_id: int, supervisor_update: SupervisorUpdate):
    db_supervisor = db.query(Supervisor).filter(Supervisor.id == supervisor_id).first()
    if db_supervisor:
        for key, value in supervisor_update.dict(exclude_unset=True).items():
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

# ---------------------------------------------------------------------------
# Custodian (Janitor II) CRUD
# ---------------------------------------------------------------------------
def _custodian_query(
    db: Session,
    wing: Optional[str] = None,
    j3_id: Optional[int] = None,
    q: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    """Build a filtered ``Custodian`` query honoring optional filters."""
    query = db.query(Custodian)

    if wing:
        query = query.join(J3, Custodian.j3_id == J3.id).join(
            Supervisor, J3.supervisor_id == Supervisor.id
        ).filter(Supervisor.wing == wing)

    if j3_id is not None:
        query = query.filter(Custodian.j3_id == j3_id)

    if is_active is not None:
        query = query.filter(Custodian.is_active == is_active)

    if q:
        like = f"%{q.lower()}%"
        query = query.filter(
            or_(
                func.lower(Custodian.first_name).like(like),
                func.lower(Custodian.last_name).like(like),
                func.lower(Custodian.uh_id).like(like),
            )
        )

    return query


def create_custodian(db: Session, custodian: CustodianCreate):
    db_custodian = Custodian(**custodian.dict())
    db.add(db_custodian)
    db.commit()
    return (
        db.query(Custodian)
        .options(selectinload(Custodian.buildings))
        .filter(Custodian.id == db_custodian.id)
        .first()
    )

def get_custodian(db: Session, custodian_id: int):
    return (
        db.query(Custodian)
        .options(selectinload(Custodian.buildings))
        .filter(Custodian.id == custodian_id)
        .first()
    )

def get_custodians(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    wing: Optional[str] = None,
    j3_id: Optional[int] = None,
    q: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    return (
        _custodian_query(db, wing=wing, j3_id=j3_id, q=q, is_active=is_active)
        .options(selectinload(Custodian.buildings))
        .order_by(Custodian.last_name, Custodian.first_name)
        .offset(skip)
        .limit(limit)
        .all()
    )

def count_custodians(
    db: Session,
    wing: Optional[str] = None,
    j3_id: Optional[int] = None,
    q: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> int:
    return _custodian_query(db, wing=wing, j3_id=j3_id, q=q, is_active=is_active).count()

def update_custodian(db: Session, custodian_id: int, custodian_update: CustodianUpdate):
    db_custodian = (
        db.query(Custodian)
        .options(selectinload(Custodian.buildings))
        .filter(Custodian.id == custodian_id)
        .first()
    )
    if db_custodian:
        data = custodian_update.dict(exclude_unset=True)
        building_ids = data.pop("building_ids", None)
        for key, value in data.items():
            setattr(db_custodian, key, value)
        if building_ids is not None:
            db_custodian.buildings.clear()
            if building_ids:
                blist = db.query(Building).filter(Building.id.in_(building_ids)).all()
                db_custodian.buildings.extend(blist)
        db.commit()
        db_custodian = (
            db.query(Custodian)
            .options(selectinload(Custodian.buildings))
            .filter(Custodian.id == custodian_id)
            .first()
        )
    return db_custodian

def delete_custodian(db: Session, custodian_id: int):
    db_custodian = db.query(Custodian).filter(Custodian.id == custodian_id).first()
    if db_custodian:
        db.delete(db_custodian)
        db.commit()
    return db_custodian

# ---------------------------------------------------------------------------
# Building CRUD
# ---------------------------------------------------------------------------
def custodian_counts_by_building(db: Session) -> Dict[int, int]:
    rows = (
        db.query(custodian_building.c.building_id, func.count())
        .group_by(custodian_building.c.building_id)
        .all()
    )
    return {int(bid): int(n) for bid, n in rows}


def create_building(
    db: Session,
    building: BuildingCreate,
    custodian_ids: Optional[List[int]] = None,
):
    db_building = Building(**building.dict())
    db.add(db_building)
    db.flush()
    if custodian_ids:
        custs = db.query(Custodian).filter(Custodian.id.in_(custodian_ids)).all()
        db_building.custodians.extend(custs)
    db.commit()
    db.refresh(db_building)
    return db_building


def get_building(db: Session, building_id: int):
    return (
        db.query(Building)
        .options(selectinload(Building.custodians))
        .filter(Building.id == building_id)
        .first()
    )

def get_buildings(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Building)
        .order_by(Building.name)
        .offset(skip)
        .limit(limit)
        .all()
    )

def update_building(db: Session, building_id: int, building_update: BuildingUpdate):
    db_building = (
        db.query(Building)
        .options(selectinload(Building.custodians))
        .filter(Building.id == building_id)
        .first()
    )
    if not db_building:
        return None
    data = building_update.dict(exclude_unset=True)
    custodian_ids = data.pop("custodian_ids", None)
    for key, value in data.items():
        setattr(db_building, key, value)
    if custodian_ids is not None:
        db_building.custodians.clear()
        if custodian_ids:
            custs = db.query(Custodian).filter(Custodian.id.in_(custodian_ids)).all()
            db_building.custodians.extend(custs)
    db.commit()
    db.refresh(db_building)
    return db_building

def delete_building(db: Session, building_id: int):
    db_building = db.query(Building).filter(Building.id == building_id).first()
    if db_building:
        db.delete(db_building)
        db.commit()
    return db_building


# ---------------------------------------------------------------------------
# Building partitions & rotation
# ---------------------------------------------------------------------------
def list_building_partitions(
    db: Session,
    building_id: int,
    floor_id: Optional[str] = None,
) -> List[BuildingPartition]:
    q = db.query(BuildingPartition).filter(BuildingPartition.building_id == building_id)
    if floor_id is not None:
        q = q.filter(BuildingPartition.floor_id == floor_id)
    return q.order_by(BuildingPartition.sort_order, BuildingPartition.id).all()


def get_partition(db: Session, partition_id: int) -> Optional[BuildingPartition]:
    return db.query(BuildingPartition).filter(BuildingPartition.id == partition_id).first()


def create_building_partition(
    db: Session,
    building_id: int,
    body: BuildingPartitionCreate,
) -> BuildingPartition:
    geom_json = body.geometry.model_dump_json()
    row = BuildingPartition(
        building_id=building_id,
        floor_id=body.floor_id,
        name=body.name,
        sort_order=body.sort_order,
        geometry=geom_json,
        fill_color=body.fill_color,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_building_partition(
    db: Session,
    partition_id: int,
    body: BuildingPartitionUpdate,
) -> Optional[BuildingPartition]:
    row = get_partition(db, partition_id)
    if row is None:
        return None
    data = body.model_dump(exclude_unset=True)
    geom = data.pop("geometry", None)
    if geom is not None:
        from schemas import GeoJSONPolygon

        row.geometry = GeoJSONPolygon(**geom).model_dump_json()
    for key, value in data.items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row


def delete_building_partition(db: Session, partition_id: int) -> Optional[BuildingPartition]:
    row = get_partition(db, partition_id)
    if row is None:
        return None
    db.delete(row)
    db.commit()
    return row


def get_partition_rotation(
    db: Session,
    building_id: int,
    j3_id: int,
) -> Optional[BuildingPartitionRotation]:
    return (
        db.query(BuildingPartitionRotation)
        .filter(
            BuildingPartitionRotation.building_id == building_id,
            BuildingPartitionRotation.j3_id == j3_id,
        )
        .first()
    )


def upsert_partition_rotation(
    db: Session,
    building_id: int,
    j3_id: int,
    anchor_date: date,
) -> BuildingPartitionRotation:
    row = get_partition_rotation(db, building_id, j3_id)
    if row is None:
        row = BuildingPartitionRotation(
            building_id=building_id,
            j3_id=j3_id,
            anchor_date=anchor_date,
        )
        db.add(row)
    else:
        row.anchor_date = anchor_date
    db.commit()
    db.refresh(row)
    return row


def partition_schedule_rows(
    db: Session,
    building_id: int,
    j3_id: int,
    schedule_date: date,
    floor_id: Optional[str] = None,
) -> Tuple[
    List[Tuple[BuildingPartition, Optional[Custodian]]],
    Optional[date],
    Optional[int],
    int,
    int,
]:
    """Returns (assignments, anchor_date, day_offset, partition_count, pool_count)."""
    rotation = get_partition_rotation(db, building_id, j3_id)
    partitions = list_building_partitions(db, building_id, floor_id=floor_id)
    pool = (
        db.query(Custodian)
        .join(custodian_building, custodian_building.c.custodian_id == Custodian.id)
        .filter(
            custodian_building.c.building_id == building_id,
            Custodian.j3_id == j3_id,
            Custodian.is_active.is_(True),
        )
        .order_by(Custodian.last_name, Custodian.first_name)
        .all()
    )
    n_p = len(partitions)
    n_c = len(pool)
    anchor = rotation.anchor_date if rotation else None
    day_off: Optional[int] = None
    if anchor is not None:
        day_off = (schedule_date - anchor).days

    out: List[Tuple[BuildingPartition, Optional[Custodian]]] = []
    if n_p == 0 or n_c == 0 or day_off is None:
        for p in partitions:
            out.append((p, None))
        return out, anchor, day_off, n_p, n_c

    for i, p in enumerate(partitions):
        ci = (i + day_off) % n_c
        out.append((p, pool[ci]))
    return out, anchor, day_off, n_p, n_c


# ---------------------------------------------------------------------------
# Task CRUD
# ---------------------------------------------------------------------------
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
