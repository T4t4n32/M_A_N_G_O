"""Unit tests for app.services.sensor_store."""
from __future__ import annotations

from datetime import datetime, timezone
from threading import Thread

import pytest

from app.services.sensor_store import LatestReading, SensorStore, sensor_store


@pytest.fixture()
def store():
    return SensorStore()


def test_get_latest_returns_none_for_unknown_sensor(store):
    assert store.get_latest("ph") is None


def test_set_latest_stores_reading(store):
    store.set_latest("ph", 7.1, 0, {"rssi": -60})

    reading = store.get_latest("ph")
    assert isinstance(reading, LatestReading)
    assert (reading.sensor_key, reading.value, reading.status) == ("ph", 7.1, 0)
    assert reading.raw == {"rssi": -60}
    assert reading.timestamp.tzinfo is timezone.utc


def test_set_latest_defaults_raw_to_empty_dict(store):
    store.set_latest("temp", 25.0, 0)
    assert store.get_latest("temp").raw == {}


def test_set_latest_overwrites_previous_reading(store):
    store.set_latest("temp", 25.0, 0)
    store.set_latest("temp", 26.5, 2)

    reading = store.get_latest("temp")
    assert (reading.value, reading.status) == (26.5, 2)


def test_none_value_is_preserved(store):
    store.set_latest("turbidity", None, 1)
    assert store.get_latest("turbidity").value is None


def test_snapshot_serializes_every_sensor(store):
    store.set_latest("ph", 7.0, 0)
    store.set_latest("temp", 25.0, 1, {"src": "lora"})

    snapshot = store.snapshot()
    assert set(snapshot) == {"ph", "temp"}
    assert snapshot["temp"] == {
        "sensor_key": "temp",
        "value": 25.0,
        "status": 1,
        "timestamp": store.get_latest("temp").timestamp.isoformat(),
        "raw": {"src": "lora"},
    }
    datetime.fromisoformat(snapshot["ph"]["timestamp"])


def test_snapshot_is_detached_from_internal_state(store):
    store.set_latest("ph", 7.0, 0)
    snapshot = store.snapshot()
    store.set_latest("ph", 9.0, 0)

    assert snapshot["ph"]["value"] == 7.0


def test_empty_snapshot(store):
    assert store.snapshot() == {}


def test_concurrent_writes_are_all_recorded(store):
    threads = [
        Thread(target=store.set_latest, args=(f"sensor-{i}", float(i), 0))
        for i in range(25)
    ]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert len(store.snapshot()) == 25


def test_module_level_store_is_a_sensor_store_instance():
    assert isinstance(sensor_store, SensorStore)
