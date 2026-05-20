# M.A.N.G.O. — Jetson TK1 Edge Deployment

## Overview

The Jetson TK1 is the primary edge processor of the M.A.N.G.O. mangrove monitoring node. It runs three long-lived services:

| Service | Function |
|---|---|
| `mango-edge-serial` | Reads ESP32 sensor data over USB serial and stores in local SQLite |
| `mango-edge-sync` | Forwards buffered readings to the backend VPS via LTE or Wi-Fi |
| `mango-edge-sms` | Monitors alert levels and sends SMS via the Huawei E3372H-153 modem |

---

## Init system: Upstart vs systemd

The Jetson TK1 ships with **Ubuntu 14.04 L4T**, which uses **Upstart** — not systemd. The `systemctl` command does not exist on this platform.

| Platform | Ubuntu version | Init system | Service commands |
|---|---|---|---|
| Jetson TK1 | 14.04 L4T | Upstart | `sudo start/stop/status <name>` |
| Jetson Nano / Xavier | 18.04+ L4T | systemd | `sudo systemctl start/stop/status <name>` |

The installer (`install_jetson.sh`) detects the init system automatically and installs the correct files. **Do not copy systemd `.service` files on a TK1.**

---

## Hardware requirements

- NVIDIA Jetson TK1 (ARM Cortex-A15, Ubuntu 14.04 L4T)
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

## Installation (first time)

```bash
# 1. Clone the repository onto the Jetson
git clone <repo_url> /home/ubuntu/M_A_N_G_O
cd /home/ubuntu/M_A_N_G_O

# 2. Configure the Huawei modem
sudo bash deploy/edge-jetson/setup_huawei_lte.sh

# 3. Run the installer (detects Upstart automatically on TK1)
sudo bash deploy/edge-jetson/install_jetson.sh

# 4. Edit the configuration file
sudo nano /opt/mango_node/.env
```

The `.env` file must be configured before services will work correctly. See `.env.edge.example` for all available variables.

---

## Updating (after git pull)

Use the update script to deploy new code without re-running the full installer:

```bash
cd /home/ubuntu/M_A_N_G_O
git pull
sudo bash deploy/edge-jetson/update_jetson.sh
```

The update script:
1. Copies `opt/mango_node/` to `/opt/mango_node/`
2. Preserves the existing `.env` file
3. Restarts all running services using the correct init system

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

### Jetson TK1 — Ubuntu 14.04 — Upstart

```bash
# Status of all services
sudo status mango-edge-serial
sudo status mango-edge-sync
sudo status mango-edge-api
sudo status mango-edge-sms

# Start services
sudo start mango-edge-serial
sudo start mango-edge-sync
sudo start mango-edge-api

# Stop services
sudo stop mango-edge-serial    # also stops sync and sms (they depend on it)

# Restart a service
sudo stop mango-edge-serial && sudo start mango-edge-serial

# Live logs
sudo tail -f /var/log/upstart/mango-edge-serial.log
sudo tail -f /var/log/upstart/mango-edge-sync.log
sudo tail -f /var/log/upstart/mango-edge-api.log
sudo tail -f /var/log/upstart/mango-edge-sms.log
```

### Jetson Nano / Xavier — Ubuntu 18.04+ — systemd

```bash
# Status
sudo systemctl status mango-edge-serial mango-edge-sync mango-edge-api mango-edge-sms

# Restart
sudo systemctl restart mango-edge-serial mango-edge-sync mango-edge-api

# Live logs
journalctl -u mango-edge-serial -f
journalctl -u mango-edge-sync -f
journalctl -u mango-edge-api -f
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
sudo tail -f /var/log/upstart/mango-edge-sms.log
```

**No data reaching the backend:**
```bash
sudo tail -f /var/log/upstart/mango-edge-sync.log
ping -c 3 8.8.8.8 -I lte0
```

**Serial port errors:**
```bash
ls -la /dev/ttyUSB*
sudo tail -f /var/log/upstart/mango-edge-serial.log
```

**`systemctl: command not found` — wrong init system:**
The Jetson TK1 uses Upstart. Use `sudo start/stop/status <service>` instead of `systemctl`.
See the "Service management" section above.
