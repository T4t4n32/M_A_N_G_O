#!/usr/bin/env bash
# Configura el Huawei E3372H-153 como interfaz de red en el Jetson TK1
# El E3372H aparece como dispositivo de almacenamiento USB primero;
# este script lo cambia al modo HiLink (Ethernet sobre USB).

set -euo pipefail

echo "=== Configuración Huawei E3372H-153 LTE ==="

# 1. Instalar herramientas necesarias
apt-get install -y usb-modeswitch usb-modeswitch-data network-manager

# 2. El E3372H en modo HiLink aparece como red Ethernet (usb0 o eth1)
# Verificar que está conectado
echo "Buscando Huawei E3372H..."
lsusb | grep -i "Huawei" || echo "Huawei no detectado aún (conecta el dispositivo)"

# 3. Crear regla udev para renombrar la interfaz de forma consistente
cat > /etc/udev/rules.d/99-mango-huawei.rules << 'EOF'
# Huawei E3372H-153 — renombrar a lte0 para identificación estable
SUBSYSTEM=="net", ATTRS{idVendor}=="12d1", NAME="lte0"
EOF

udevadm control --reload-rules
udevadm trigger

# 4. Configurar NetworkManager para gestionar la interfaz LTE
# Prioridad baja (100) para que Wi-Fi (600) tenga precedencia
nmcli connection add \
    type ethernet \
    con-name "mango-lte" \
    ifname lte0 \
    ipv4.method auto \
    ipv6.method ignore \
    connection.autoconnect yes \
    ipv4.route-metric 100 \
    2>/dev/null || echo "Conexión mango-lte ya existe"

echo ""
echo "=== Verificación ==="
echo "Interfaces activas:"
ip link show | grep -E "^[0-9]+: (wlan|lte|eth|usb)" | awk '{print $2}'
echo ""
echo "Conecta el Huawei E3372H-153 y ejecuta:"
echo "  ip addr show lte0"
echo "  ping -c 3 8.8.8.8 -I lte0"