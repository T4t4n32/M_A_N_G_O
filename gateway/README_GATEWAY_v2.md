# RX Gateway (Laptop) — Paso a paso (v2)

Este v2 corrige el SyntaxError y parsea tus líneas reales:

- MANGO_META:{...}
- MANGO_JSON:{...}

## 1) Crear carpeta
```bash
mkdir -p ~/mango_gateway
cd ~/mango_gateway
```

## 2) Copiar archivos
Copia aquí:
- `rx_gateway.py`
- `requirements.gateway.txt`

## 3) Crear venv e instalar
```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.gateway.txt
```

## 4) Permisos del serial
```bash
ls -l /dev/ttyUSB0
```
Si te da permiso denegado:
```bash
sudo usermod -aG dialout $USER
# Cierra sesión y vuelve a entrar
```

## 5) Ejecutar (backend local con docker)
```bash
API_URL="http://localhost:8000/api/v1/ingest" \
SERIAL_PORT="/dev/ttyUSB0" BAUDRATE="115200" \
./venv/bin/python rx_gateway.py
```

## 6) Ver datos offline (API local)
- http://localhost:9100/health
- http://localhost:9100/api/v1/metrics
- http://localhost:9100/api/v1/latest/by_type
- http://localhost:9100/api/v1/range?type=temp&minutes=60

## 7) Debug (opcional)
Para enviar métricas extra (voltajes/raw y rssi/snr):
```bash
SEND_DEBUG=1 ./venv/bin/python rx_gateway.py
```
