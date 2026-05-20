"""Configuration settings for M.A.N.G.O. node.

This module centralises all constants used across the node
processes.  Adjust these values to match your deployment.  In
particular, you should set ``API_URL`` to point at the ingest
endpoint of your backend and ``STATION_NAME`` to a stable
identifier for this device.  ``API_URL`` should include the
``/api/v1/ingest`` suffix, since the backend groups API routes
under ``/api/v1`` and the ingestion route lives at ``/ingest``
(see ``backend/app/routes.py`` in the M.A.N.G.O. repository【773113831410507†L20-L71】).  If your backend
requires an API key header, set ``INGEST_API_KEY`` accordingly.

All time constants are expressed in seconds.  ``READ_INTERVAL``
controls how often the node attempts to read a new packet from the
serial port.  ``SYNC_INTERVAL`` determines how frequently the
sync manager tries to flush pending measurements to the backend.

Note that the Jetson does not directly interface with the sensors
electrically.  Instead, an ESP32 reads the PT100/Max31865
temperature sensor, pH probe and turbidity module, then
transmits a compact payload over LoRa and mirrors the same
payload via USB serial to the Jetson【525100557324170†L53-L91】.  The node
uses a serial reader to capture those frames; see
``serial_acquire.py`` for details.
"""

from __future__ import annotations

import os

# Unique identifier for this station.  This name is sent to the
# backend as the ``station.name`` field.  Use a stable value so
# data from the same device are grouped together.
STATION_NAME: str = os.getenv("MANGO_STATION_NAME", "MANGO-TK1-01")

# Unique device identifier used in packet_id generation.
# Format: mango-<role>-<unit>, e.g. mango-jetson-01 or mango-sensor-esp32-01
# This is distinct from STATION_NAME: the station is the deployment location,
# the device_id is the physical hardware unit.
DEVICE_ID: str = os.getenv("MANGO_DEVICE_ID", STATION_NAME)

# Full URL of the ingest endpoint on your backend.  Must include
# the path, e.g. "http://localhost:8000/api/v1/ingest".  The
# backend defined in ``backend/app/routes.py`` expects POST
# requests at this endpoint with a JSON payload containing
# ``station`` and ``readings`` fields【773113831410507†L59-L117】.
API_URL: str = os.getenv("MANGO_API_URL", "http://localhost:8000/api/v1/ingest")

# Optional API key to include as ``X-API-Key`` header.  Leave
# blank if your backend does not require authentication.
INGEST_API_KEY: str = os.getenv("MANGO_API_KEY", "")

# Serial device where the ESP32 is connected.  On a Jetson TK1
# this is typically ``/dev/ttyUSB0`` or ``/dev/ttyACM0``.  See
# ``gateway/README_GATEWAY.md`` for testing instructions【381701738290†L23-L33】.
SERIAL_PORT: str = os.getenv("MANGO_SERIAL_PORT", "/dev/ttyUSB0")

# Baudrate matching the ESP32 serial configuration.  The firmware
# examples default to 115200 baud.
SERIAL_BAUDRATE: int = int(os.getenv("MANGO_SERIAL_BAUDRATE", "115200"))

# Read timeout in seconds for the serial port.  A short timeout
# allows the loop to check for exit conditions and connectivity
# changes without blocking indefinitely.
SERIAL_TIMEOUT: float = float(os.getenv("MANGO_SERIAL_TIMEOUT", "1.0"))

# Number of seconds between serial read attempts if no data are
# received.  Lower values yield more responsive updates but can
# consume more CPU.
READ_INTERVAL: float = float(os.getenv("MANGO_READ_INTERVAL", "0.5"))

# How often (in seconds) the sync manager checks for unsent
# measurements and attempts to flush them to the backend.
SYNC_INTERVAL: float = float(os.getenv("MANGO_SYNC_INTERVAL", "8.0"))

# Maximum number of rows to send in a single HTTP batch.  Larger
# batches reduce overhead but may lead to bigger payloads if the
# node has been offline for a while.
HTTP_BATCH_SIZE: int = int(os.getenv("MANGO_HTTP_BATCH_SIZE", "50"))

# Path to the local SQLite database used for spooling.
DB_PATH: str = os.getenv("MANGO_DB_PATH", "/opt/mango_node/mango_node.db")

# Configure which network interfaces correspond to Wi‑Fi and
# cellular (Huawei modem).  ``link_state.py`` uses this to
# prioritise Wi‑Fi over LTE when deciding which transport to use.
WIFI_IFACES: list[str] = os.getenv("MANGO_WIFI_IFACES", "wlan0").split(",")
LTE_IFACES: list[str] = os.getenv("MANGO_LTE_IFACES", "usb0,wwan0,eth1").split(",")

# Optionally enable LoRa fallback.  When set to true, the
# ``transport_lora`` module is used if no HTTP transport is
# available.  See ``link_state.py`` for detection logic.  Note
# that the Jetson does not include a LoRa transceiver by default;
# enabling this requires additional hardware.
ENABLE_LORA: bool = os.getenv("MANGO_ENABLE_LORA", "0") in ("1", "true", "True", "yes", "YES")

# Logging verbosity.  Set to True to print diagnostic messages to
# stdout.  In production deployments you may prefer to let
# systemd's journal capture logs.
VERBOSE: bool = os.getenv("MANGO_VERBOSE", "1") in ("1", "true", "True", "yes", "YES")

# ---------------------------------------------------------------------------
# SMS alert dispatcher (sms_dispatch.py)
# ---------------------------------------------------------------------------

# Set to 0 to disable SMS sending without removing the service.
SMS_ENABLED: bool = os.getenv("MANGO_SMS_ENABLED", "1") in ("1", "true", "True", "yes", "YES")

# IP address of the Huawei E3372H-153 modem in HiLink mode.
# The modem acts as a USB-Ethernet gateway; its default IP is 192.168.8.1.
HUAWEI_GATEWAY: str = os.getenv("MANGO_HUAWEI_GATEWAY", "192.168.8.1")

# Minimum seconds between consecutive SMS alerts for the same sensor
# type and alert level.  Prevents flooding during sustained anomalies.
SMS_COOLDOWN_S: float = float(os.getenv("MANGO_SMS_COOLDOWN_S", "1800"))

# How often (seconds) the dispatcher refreshes alert rules and contacts
# from the backend.  Rules are cached between refreshes.
SMS_CONFIG_REFRESH_S: float = float(os.getenv("MANGO_SMS_CONFIG_REFRESH_S", "900"))

# How often (seconds) the dispatcher polls the local SQLite database
# for new unsent alert measurements.
SMS_POLL_S: float = float(os.getenv("MANGO_SMS_POLL_S", "15"))