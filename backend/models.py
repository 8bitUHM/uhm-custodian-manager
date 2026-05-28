from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Date,
    ForeignKey,
    Text,
    Enum,
    Table,
    UniqueConstraint,
    Float,
    Numeric,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

custodian_building = Table(
    "custodian_building",
    Base.metadata,
    Column(
        "custodian_id",
        Integer,
        ForeignKey("custodians.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "building_id",
        Integer,
        ForeignKey("buildings.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

class TaskStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"

class Custodian(Base):
    __tablename__ = "custodians"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), index=True, nullable=True)
    phone = Column(String(20))
    employee_id = Column(String(50), unique=True, index=True)
    # UH-issued employee ID (from BGM Roster), kept separate from any future internal ID
    uh_id = Column(String(50), index=True)
    # Position/slot number (e.g. "22334") from the org chart
    position_id = Column(String(50), index=True)
    # Position title (e.g. "Janitor II", "Janitor III"). Defaults to JII since
    # the bulk of seeded custodians are JIIs.
    position_title = Column(String(50), default="Janitor II")
    is_active = Column(Boolean, default=True)
    hire_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Each Janitor II reports to a Janitor III (group lead).
    j3_id = Column(Integer, ForeignKey("j3.id"))

    # Relationships
    j3 = relationship("J3", back_populates="j2list")
    tasks = relationship("Task", back_populates="custodian")
    buildings = relationship(
        "Building",
        secondary=custodian_building,
        back_populates="custodians",
    )

class Supervisor(Base):
    __tablename__ = "supervisors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    # Wing this SII manages: "EWA", "MAUKA", or "MAKAI".
    wing = Column(String(20), index=True)
    # Building & Grounds Management org code (e.g. "MAC1BG").
    org_code = Column(String(20), index=True)
    # Position/slot number from the org chart (e.g. "8053").
    position_id = Column(String(50), index=True)
    uh_id = Column(String(50), index=True)

    # The Janitor 3's that the supervisor is in charge of
    j3list = relationship("J3", back_populates="supervisor")

class J3(Base):
    __tablename__ = "j3"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    # Numbered work group this JIII leads (1..20, skipping 8/12 per the BGM roster).
    group_number = Column(Integer, index=True)
    position_id = Column(String(50), index=True)
    uh_id = Column(String(50), index=True)

    # thingies that help connect J3 and supervisor together
    supervisor_id = Column(Integer, ForeignKey("supervisors.id"))
    supervisor = relationship("Supervisor", back_populates="j3list")

    # Janitor IIs working under this JIII.
    j2list = relationship("Custodian", back_populates="j3")

class Building(Base):
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    address = Column(String(500), nullable=False)
    building_code = Column(String(20), unique=True, index=True)
    floors = Column(Integer)
    description = Column(Text)
    # Matches frontend/public/buildings/<slug>/ for static floor plans & 3D assets.
    public_slug = Column(String(100), index=True, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tasks = relationship("Task", back_populates="building")
    custodians = relationship(
        "Custodian",
        secondary=custodian_building,
        back_populates="buildings",
    )
    partitions = relationship(
        "BuildingPartition",
        back_populates="building",
        cascade="all, delete-orphan",
    )
    partition_rotations = relationship(
        "BuildingPartitionRotation",
        back_populates="building",
        cascade="all, delete-orphan",
    )
    spaces = relationship(
        "BuildingSpace",
        back_populates="building",
        cascade="all, delete-orphan",
    )


class CleaningUnit(str, enum.Enum):
    per_space = "per_space"
    per_sqft = "per_sqft"


class CleaningSpaceType(Base):
    """Configurable cleaning time standard per space category."""

    __tablename__ = "cleaning_space_types"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(80), unique=True, nullable=False, index=True)
    label = Column(String(200), nullable=False)
    minutes_per_unit = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False, default=CleaningUnit.per_space.value)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, nullable=False, default=0)

    mappings = relationship("SpaceTypeMapping", back_populates="cleaning_space_type")
    spaces = relationship("BuildingSpace", back_populates="cleaning_space_type")


class CleaningSettings(Base):
    """Singleton-style global workload settings (row id=1)."""

    __tablename__ = "cleaning_settings"

    id = Column(Integer, primary_key=True)
    workday_minutes = Column(Integer, nullable=False, default=480)
    # comma-separated preference: polyline_sqft,cad_gross,user_sqft
    sqft_preference = Column(String(100), nullable=False, default="polyline_sqft,cad_gross,user_sqft")


class AimPropertyMapping(Base):
    """Maps AiM Property code to a campus building."""

    __tablename__ = "aim_property_mappings"

    id = Column(Integer, primary_key=True, index=True)
    property_code = Column(Integer, unique=True, nullable=False, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False)

    building = relationship("Building")


class SpaceTypeMapping(Base):
    """Rule to classify an AiM row into a cleaning space type."""

    __tablename__ = "space_type_mappings"

    id = Column(Integer, primary_key=True, index=True)
    cleaning_space_type_id = Column(
        Integer, ForeignKey("cleaning_space_types.id", ondelete="CASCADE"), nullable=False
    )
    match_field = Column(String(30), nullable=False, default="description")
    match_kind = Column(String(20), nullable=False, default="contains")
    match_value = Column(String(200), nullable=False)
    priority = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True)

    cleaning_space_type = relationship("CleaningSpaceType", back_populates="mappings")


class BuildingSpace(Base):
    """Imported AiM location row for workload calculation."""

    __tablename__ = "building_spaces"

    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False)
    location_code = Column(String(50), nullable=False)
    description = Column(String(500), nullable=True)
    primary_type = Column(String(50), nullable=True)
    location_type_group = Column(String(50), nullable=True)
    user_sqft = Column(Numeric(12, 2), nullable=True)
    cad_gross = Column(Numeric(12, 2), nullable=True)
    polyline_sqft = Column(Numeric(12, 2), nullable=True)
    effective_sqft = Column(Numeric(12, 2), nullable=True)
    cleaning_space_type_id = Column(
        Integer, ForeignKey("cleaning_space_types.id", ondelete="SET NULL"), nullable=True
    )
    cleaning_minutes = Column(Float, nullable=False, default=0.0)
    source_property_code = Column(Integer, nullable=True)
    import_batch_id = Column(String(36), nullable=False, index=True)
    imported_at = Column(DateTime(timezone=True), server_default=func.now())

    building = relationship("Building", back_populates="spaces")
    cleaning_space_type = relationship("CleaningSpaceType", back_populates="spaces")

    __table_args__ = (
        UniqueConstraint(
            "building_id",
            "location_code",
            "import_batch_id",
            name="uq_building_space_location_batch",
        ),
    )


class BuildingPartition(Base):
    """Floor zone drawn on the building SVG (coordinates in SVG user space, not WGS84)."""

    __tablename__ = "building_partitions"

    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False)
    floor_id = Column(String(50), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    geometry = Column(Text, nullable=False)
    fill_color = Column(String(20), nullable=True)

    building = relationship("Building", back_populates="partitions")


class BuildingPartitionRotation(Base):
    """Anchor calendar day for rotating partition assignments per building + JIII."""

    __tablename__ = "building_partition_rotations"

    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False)
    j3_id = Column(Integer, ForeignKey("j3.id", ondelete="CASCADE"), nullable=False)
    anchor_date = Column(Date, nullable=False)

    building = relationship("Building", back_populates="partition_rotations")
    j3 = relationship("J3", backref="partition_rotations")

    __table_args__ = (
        UniqueConstraint("building_id", "j3_id", name="uq_partition_rotation_building_j3"),
    )


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(Enum(TaskStatus), default=TaskStatus.pending)
    priority = Column(String(20), default="medium")  # low, medium, high
    assigned_to = Column(Integer, ForeignKey("custodians.id"))
    building_id = Column(Integer, ForeignKey("buildings.id"))
    scheduled_date = Column(DateTime(timezone=True))
    completed_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    custodian = relationship("Custodian", back_populates="tasks")
    building = relationship("Building", back_populates="tasks")
