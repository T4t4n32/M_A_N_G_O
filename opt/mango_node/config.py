"""Configuration settings for M.A.N.G.O. node.

All settings are read from environment variables with sane defaults.
Copy deploy/edge-jetson/.env.edge.example to /opt/mango_node/.env and
edit before starting services.
"""

import os

STATION_NAME = os.getenv("MANGO_STATION_NAME", "MANGO-TK1-01")
DEVICE_ID = os.getenv("MANGO_DEVICE_ID", STATION_NAME)
API_URL = os.getenv("MANGO_API_URL", "http://localhost:8000/api/v1/ingest")
INGEST_API_KEY = os.getenv("MANGO_API_KEY", "")
SERIAL_PORT = os.getenv("MANGO_SERIAL_PORT", "/dev/ttyUSB0")
SERIAL_BAUDRATE = int(os.getenv("MANGO_SERIAL_BAUDRATE", "115200"))
SERIAL_TIMEOUT = float(os.getenv("MANGO_SERIAL_TIMEOUT", "1.0"))
READ_INTERVAL = float(os.getenv("MANGO_READ_INTERVAL", "0.5"))
SYNC_INTERVAL = float(os.getenv("MANGO_SYNC_INTERVAL", "8.0"))
HTTP_BATCH_SIZE = int(os.getenv("MANGO_HTTP_BATCH_SIZE", "50"))
DB_PATH = os.getenv("MANGO_DB_PATH", "/opt/mango_node/mango_node.db")
WIFI_IFACES = os.getenv("MANGO_WIFI_IFACES", "wlan0").split(",")
LTE_IFACES = os.getenv("MANGO_LTE_IFACES", "usb0,wwan0,eth1").split(",")
ENABLE_LORA = os.getenv("MANGO_ENABLE_LORA", "0") in ("1", "true", "True", "yes", "YES")
VERBOSE = os.getenv("MANGO_VERBOSE", "1") in ("1", "true", "True", "yes", "YES")

SMS_ENABLED = os.getenv("MANGO_SMS_ENABLED", "1") in ("1", "true", "True", "yes", "YES")
HUAWEI_GATEWAY = os.getenv("MANGO_HUAWEI_GATEWAY", "192.168.8.1")
SMS_COOLDOWN_S = float(os.getenv("MANGO_SMS_COOLDOWN_S", "1800"))
SMS_CONFIG_REFRESH_S = float(os.getenv("MANGO_SMS_CONFIG_REFRESH_S", "900"))
SMS_POLL_S = float(os.getenv("MANGO_SMS_POLL_S", "15"))
