"""Unit tests for app.services.validation_service."""
from __future__ import annotations

import pytest

from app.services.validation_service import REASON, validate_reading


class FakeSensor:
    def __init__(self, sensor_type):
        self.type = sensor_type


@pytest.mark.parametrize("sensor_type,value", [
    ("ph", 7.2),
    ("PH", 0),
    ("ph", 14),
    ("temp", 25.4),
    ("temperature", -50),
    ("temp", 150),
    ("turbidity", 0),
    ("turbidity", 1000),
])
def test_values_inside_range_are_valid(sensor_type, value):
    result = validate_reading(FakeSensor(sensor_type), value)
    assert result == {"valid": True, "reason": None, "quality": "ok"}


def test_numeric_strings_are_accepted():
    assert validate_reading(FakeSensor("ph"), "7.5")["valid"] is True


@pytest.mark.parametrize("value", [None, "abc", "", float("nan"), float("inf")])
def test_non_numeric_values_are_rejected(value):
    result = validate_reading(FakeSensor("ph"), value)
    assert result == {
        "valid": False,
        "reason": REASON["NOT_A_NUMBER"],
        "quality": "error",
    }


@pytest.mark.parametrize("sensor_type,value,reason_key", [
    ("ph", -0.1, "OUT_OF_RANGE_PH"),
    ("ph", 14.1, "OUT_OF_RANGE_PH"),
    ("temp", -50.1, "OUT_OF_RANGE_TEMP"),
    ("temperature", 150.1, "OUT_OF_RANGE_TEMP"),
    ("turbidity", -1, "OUT_OF_RANGE_NTU"),
    ("turbidity", 1000.5, "OUT_OF_RANGE_NTU"),
])
def test_out_of_range_values_are_flagged_for_maintenance(sensor_type, value, reason_key):
    result = validate_reading(FakeSensor(sensor_type), value)
    assert result == {
        "valid": False,
        "reason": REASON[reason_key],
        "quality": "maintenance",
    }


def test_rtd_fault_meta_takes_precedence_over_range_check():
    result = validate_reading(FakeSensor("temp"), 999, meta={"fault": True})
    assert result == {
        "valid": False,
        "reason": REASON["RTD_FAULT"],
        "quality": "maintenance",
    }


def test_rtd_fault_meta_is_ignored_for_other_sensor_types():
    result = validate_reading(FakeSensor("ph"), 7.0, meta={"fault": True})
    assert result["valid"] is True


def test_large_ph_jump_is_valid_but_marked_as_warning():
    result = validate_reading(FakeSensor("ph"), 7.0, last_valid_value=4.0)
    assert result == {
        "valid": True,
        "reason": REASON["SUSPECT_JUMP_PH"],
        "quality": "warn",
    }


def test_small_ph_jump_stays_ok():
    result = validate_reading(FakeSensor("ph"), 7.0, last_valid_value=6.0)
    assert result == {"valid": True, "reason": None, "quality": "ok"}


def test_jump_check_is_not_applied_to_other_sensor_types():
    result = validate_reading(FakeSensor("temp"), 30.0, last_valid_value=1.0)
    assert result["quality"] == "ok"


def test_unparsable_last_valid_value_does_not_break_validation():
    result = validate_reading(FakeSensor("ph"), 7.0, last_valid_value="not-a-number")
    assert result == {"valid": True, "reason": None, "quality": "ok"}


def test_booleans_are_coerced_to_numbers():
    # _is_bad_number() checks isinstance(x, bool), but it runs after float(),
    # so booleans reach validation as 1.0 / 0.0 instead of being rejected.
    assert validate_reading(FakeSensor("ph"), True)["valid"] is True


def test_unknown_sensor_type_skips_range_checks():
    result = validate_reading(FakeSensor("salinity"), 12345)
    assert result["valid"] is True


def test_sensor_without_type_attribute_is_handled():
    result = validate_reading(object(), 7.0)
    assert result["valid"] is True
