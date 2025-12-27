from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

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
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20))
    employee_id = Column(String(50), unique=True, index=True)
    is_active = Column(Boolean, default=True)
    hire_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tasks = relationship("Task", back_populates="custodian")

class Supervisor(Base):
    __tablename__ = "supervisors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)

    # The Janitor 3's that the supervisor is in charge of
    j3list = relationship("J3", back_populates="supervisor")

class J3(Base):
    __tablename__ = "j3"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)

    # thingies that help connect J3 and supervisor together
    supervisor_id = Column(Integer, ForeignKey("supervisors.id"))
    supervisor = relationship("Supervisor", back_populates="j3list")

    # The Janitor 2's that the J3 is in charge of
    j2list = relationship("J2", back_populates="j3")

class J2(Base):
    __tablename__ = "j2"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)

    # thingies that help connect J2 and J3 together
    j3_id = Column(Integer, ForeignKey("j3.id"))
    j3 = relationship("J3", back_populates="j2list")

class Building(Base):
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    address = Column(String(500), nullable=False)
    building_code = Column(String(20), unique=True, index=True)
    floors = Column(Integer)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tasks = relationship("Task", back_populates="building")

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
