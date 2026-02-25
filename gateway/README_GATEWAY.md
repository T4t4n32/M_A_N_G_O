# M.A.N.G.O. RX Gateway (Laptop) — Step-by-step

This runs on the laptop connected to the LoRa RX ESP32.

## 1) Create folder
```bash
sudo mkdir -p /opt/mango/gateway
sudo chown -R $USER:$USER /opt/mango/gateway
```

## 2) Copy files
Put these files into `/opt/mango/gateway/`:
- `rx_gateway.py`
- `requirements.gateway.txt`

## 3) Create venv + install deps
```bash
cd /opt/mango/gateway
python3 -m venv venv
./venv/bin/pip install -r requirements.gateway.txt
```

## 4) Quick test (manual run)
Check device:
```bash
ls -l /dev/ttyUSB0
```

Run:
```bash
API_URL="http://localhost:8000/api/v1/ingest" \
SERIAL_PORT="/dev/ttyUSB0" \
BAUDRATE="115200" \
python3 rx_gateway.py
```

## 5) Enable systemd service (auto-start)
```bash
sudo cp mango-rx-gateway.service /etc/systemd/system/mango-rx-gateway.service
sudo systemctl daemon-reload
sudo systemctl enable --now mango-rx-gateway
sudo journalctl -u mango-rx-gateway -f
```

## 6) Offline local API
While the script runs, open:
- `http://localhost:9100/health`
- `http://localhost:9100/api/v1/metrics`
- `http://localhost:9100/api/v1/latest/by_type`
- `http://localhost:9100/api/v1/range?type=temp&minutes=60`
