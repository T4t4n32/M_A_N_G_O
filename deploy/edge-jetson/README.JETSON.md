# M.A.N.G.O. — Jetson TK1 Edge Deployment

## Overview

The Jetson TK1 is the primary edge processor of the M.A.N.G.O. mangrove monitoring node. It runs three long-lived services:

| Service | Function |
|---|---|
| `mango-edge-serial` | Reads ESP32 sensor data over USB serial and stores in local SQLite |
| `mango-edge-sync` | Forwards buffered readings to the backend VPS via LTE or Wi-Fi |
| `mango-edge-sms` | Monitors alert levels and sends SMS via the Huawei E3372H-153 modem |

The services are supervised by systemd and restart automatically on failure.

---

## Hardware requirements

- NVIDIA Jetson TK1 (ARM Cortex-A15, Ubuntu 14.04/16.04 L4T)
- ESP32 connected to the PT100, pH probe, and turbidity sensor — USB serial to Jetson
- Huawei E3372H-153 LTE modem — USB to Jetson
- (Optional) Wi-Fi adapter on wlan0

---

## Huawei E3372H-153 — connectivity and SMS

The E3372H-153 operates in **HiLink mode**: it presents itself to the OS as a USB-Ethernet adapter. No PPP or wvdial required.

- The modem appears as interface `lte0` (renamed by the udev rule in `setup_huawei_lte.sh`)
- Its gateway is `192.168.8.1`
- Internet traffic is routed through the modem automatically via NetworkManager

**SMS** is sent through the modem's local HTTP API at `http://192.168.8.1/api/sms/send-sms`. The `mango-edge-sms` service handles this transparently. No additional configuration is needed on the modem itself — the API is available by default on all E3372H-153 firmware versions.

---

## Installation

```bash
# 1. Clone the repository onto the Jetson (or copy the files)
git clone <repo_url> /home/mango/M_A_N_G_O
cd /home/mango/M_A_N_G_O

# 2. Configure the Huawei modem
sudo bash deploy/edge-jetson/setup_huawei_lte.sh

# 3. Run the installer
sudo bash deploy/edge-jetson/install_jetson.sh

# 4. Edit the configuration file
sudo nano /opt/mango_node/.env
```

The `.env` file must be configured before services will work correctly. See `.env.edge.example` for all available variables.

---

## Configuration

Copy `deploy/edge-jetson/.env.edge.example` to `/opt/mango_node/.env` and set:

| Variable | Description |
|---|---|
| `MANGO_STATION_NAME` | Unique identifier for this node |
| `MANGO_API_URL` | Backend ingest endpoint, e.g. `https://integramosoe.com/api/v1/ingest` |
| `MANGO_API_KEY` | Shared secret matching `INGEST_API_KEY` on the backend |
| `MANGO_SERIAL_PORT` | USB serial port of the ESP32, e.g. `/dev/ttyUSB0` |
| `MANGO_SMS_ENABLED` | Set to `0` to disable SMS without stopping the service |
| `MANGO_HUAWEI_GATEWAY` | Modem IP (default `192.168.8.1`) |
| `MANGO_SMS_COOLDOWN_S` | Minimum seconds between SMS per sensor+level (default `1800`) |

---

## Configuring alert rules and contacts

Alert thresholds and recipient phone numbers are configured **from the backend admin panel**, not on the device. This means:

- Rules can be changed without touching the Jetson
- Multiple contacts can receive alerts
- The full alert history is visible in the dashboard

**Admin API endpoints** (require admin session):

```
# Define a threshold rule
POST /api/v1/alerts/rules
{
  "sensor_type": "ph",          # ph | temperature | turbidity
  "comparison": "above",        # above | below
  "threshold": 9.5,
  "level": "warning",           # warning | critical
  "enabled": true
}

# Add a contact
POST /api/v1/alerts/contacts
{
  "name": "Responsable manglar",
  "phone": "+573001234567",      # E.164 format
  "active": true
}
```

The edge node fetches this configuration from the backend every 15 minutes (configurable via `MANGO_SMS_CONFIG_REFRESH_S`).

---

## SMS message format

```
MANGO ALERTA [ADVERTENCIA] Estacion: MANGO-TK1-01 | pH: 9.72 | 2026-05-15 14:32 UTC
MANGO ALERTA [CRITICO] Estacion: MANGO-TK1-01 | Turbidez: 63.40 NTU | 2026-05-15 14:33 UTC
```

Messages are capped at 160 characters (single SMS).

---

## Service management

```bash
# Status of all services
systemctl status mango-edge-serial mango-edge-sync mango-edge-sms

# Live logs
journalctl -u mango-edge-serial -f
journalctl -u mango-edge-sync -f
journalctl -u mango-edge-sms -f

# Restart a service
sudo systemctl restart mango-edge-sms

# Disable SMS temporarily
sudo systemctl stop mango-edge-sms
# Re-enable
sudo systemctl start mango-edge-sms
```

---

## Troubleshooting

**Modem not detected:**
```bash
lsusb | grep 12d1
ip addr show lte0
```

**SMS not sending:**
```bash
curl http://192.168.8.1/api/device/basic_information
journalctl -u mango-edge-sms -f
```

**No data reaching the backend:**
```bash
journalctl -u mango-edge-sync -f
ping -c 3 8.8.8.8 -I lte0
```

**Serial port errors:**
```bash
ls -la /dev/ttyUSB*
journalctl -u mango-edge-serial -f
```
