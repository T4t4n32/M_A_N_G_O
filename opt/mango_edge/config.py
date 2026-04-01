# -*- coding: utf-8 -*-

DEVICE_ID = "MANGO-TK1-01"

DB_PATH = "/opt/mango_edge/mango_edge.db"

API_BASE = "https://tu-dominio.com"
HEALTH_URL = API_BASE + "/health"
INGEST_URL = API_BASE + "/api/v1/ingest"

READ_INTERVAL_SEC = 20
SYNC_INTERVAL_SEC = 8
HTTP_TIMEOUT_SEC = 8
HTTP_BATCH_SIZE = 20

# Ajusta esto según la interfaz real de tu Jetson
WIFI_IFACES = ["wlan0"]
LTE_IFACES = ["usb0", "wwan0", "eth1"]

# Comandos LoRa: reemplázalos por tu script real
# Deben devolver 0 si todo salió bien
LORA_PING_CMD = ["/usr/bin/python3", "/opt/mango_edge/lora_gateway_ping.py"]
LORA_SEND_CMD = ["/usr/bin/python3", "/opt/mango_edge/lora_send.py"]