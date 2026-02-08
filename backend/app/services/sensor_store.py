from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from threading import RLock
from typing import Any, Dict, Optional


@dataclass
class LatestReading:
    sensor_key: str
    value: float | None
    status: int               # 0=OK, 1=OFFLINE, 2=OUT_OF_RANGE
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    raw: Dict[str, Any] = field(default_factory=dict)


class SensorStore:
    """
    Minimal in-memory store for 'latest reading per sensor'.
    This fixes ModuleNotFoundError and gives you a place to cache latest values
    for websocket/dashboard without depending on DB queries.
    """
    def __init__(self) -> None:
        self._lock = RLock()
        self._latest: Dict[str, LatestReading] = {}

    def set_latest(self, sensor_key: str, value: float | None, status: int, raw: Dict[str, Any] | None = None) -> None:
        if raw is None:
            raw = {}
        with self._lock:
            self._latest[sensor_key] = LatestReading(
                sensor_key=sensor_key,
                value=value,
                status=status,
                raw=raw,
            )

    def get_latest(self, sensor_key: str) -> Optional[LatestReading]:
        with self._lock:
            return self._latest.get(sensor_key)

    def snapshot(self) -> Dict[str, Dict[str, Any]]:
        with self._lock:
            return {
                k: {
                    "sensor_key": v.sensor_key,
                    "value": v.value,
                    "status": v.status,
                    "timestamp": v.timestamp.isoformat(),
                    "raw": v.raw,
                }
                for k, v in self._latest.items()
            }


sensor_store = SensorStore()
