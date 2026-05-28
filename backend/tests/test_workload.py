"""Unit tests for workload calculation and mapping."""
import pytest

from workload import (
    effective_sqft_from_row,
    match_mapping,
    minutes_for_space,
    resolve_space_type,
)
from models import CleaningSpaceType, CleaningUnit, SpaceTypeMapping


class FakeMapping:
    def __init__(
        self,
        cleaning_space_type_id: int,
        match_field: str,
        match_kind: str,
        match_value: str,
        priority: int = 0,
        is_active: bool = True,
    ):
        self.cleaning_space_type_id = cleaning_space_type_id
        self.match_field = match_field
        self.match_kind = match_kind
        self.match_value = match_value
        self.priority = priority
        self.is_active = is_active


def test_effective_sqft_preference_order():
    row = {"polyline_sqft": None, "cad_gross": 100.0, "user_sqft": 50.0}
    assert effective_sqft_from_row(row, ["polyline_sqft", "cad_gross", "user_sqft"]) == 100.0
    row2 = {"polyline_sqft": 200.0, "cad_gross": 100.0, "user_sqft": 50.0}
    assert effective_sqft_from_row(row2, ["polyline_sqft", "cad_gross", "user_sqft"]) == 200.0


def test_match_contains_and_exact():
    m = FakeMapping(1, "description", "contains", "ELEVATOR", priority=10)
    assert match_mapping({"description": "MAIN ELEVATOR LOBBY"}, m)
    m2 = FakeMapping(1, "description", "exact", "1", priority=10)
    assert match_mapping({"description": "1"}, m2)
    assert not match_mapping({"description": "10"}, m2)


def test_minutes_per_space_and_sqft():
    office = CleaningSpaceType(
        slug="office",
        label="Office",
        minutes_per_unit=5.0,
        unit=CleaningUnit.per_space.value,
    )
    unmapped = CleaningSpaceType(
        slug="unmapped_sqft",
        label="Unmapped",
        minutes_per_unit=0.01,
        unit=CleaningUnit.per_sqft.value,
    )
    assert minutes_for_space(office, 100.0, unmapped) == 5.0
    assert minutes_for_space(unmapped, 1000.0, unmapped) == 10.0
    assert minutes_for_space(None, 1000.0, unmapped) == 10.0


def test_resolve_space_type_priority():
    elevator = CleaningSpaceType(id=1, slug="elevator", label="Elevator", minutes_per_unit=10, unit="per_space")
    office = CleaningSpaceType(id=2, slug="office", label="Office", minutes_per_unit=5, unit="per_space")
    types = {1: elevator, 2: office}
    mappings = [
        FakeMapping(2, "description", "contains", "OFFICE", priority=30),
        FakeMapping(1, "description", "contains", "ELEVATOR", priority=90),
    ]
    row = {"description": "ELEVATOR LOBBY OFFICE"}
    st = resolve_space_type(row, mappings, types)
    assert st.slug == "elevator"
