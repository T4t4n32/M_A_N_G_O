# RX Gateway v3 — ver lo que llega (PASO A PASO)

## Reemplazar archivo
Copia `rx_gateway.py` v3 sobre tu `~/mango_gateway/rx_gateway.py`.

## Ejecutar (muestra 1 de cada 10 paquetes)
```bash
cd ~/mango_gateway
LOG_EVERY_N=10 LOG_SEND=1 \
API_URL="http://localhost:8000/api/v1/ingest" \
SERIAL_PORT="/dev/ttyUSB0" BAUDRATE="115200" \
./venv/bin/python rx_gateway.py
```

## Ver TODO el serial (muy ruidoso)
```bash
LOG_RAW=1 LOG_SEND=0 \
API_URL="http://localhost:8000/api/v1/ingest" \
SERIAL_PORT="/dev/ttyUSB0" BAUDRATE="115200" \
./venv/bin/python rx_gateway.py
```

## No guardar valores -1 (temp/ph) si te estorban en el dashboard
```bash
DROP_NEG1=1 LOG_EVERY_N=10 \
API_URL="http://localhost:8000/api/v1/ingest" \
SERIAL_PORT="/dev/ttyUSB0" BAUDRATE="115200" \
./venv/bin/python rx_gateway.py
```
