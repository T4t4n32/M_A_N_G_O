#!/usr/bin/env bash
# Configura el Huawei E3372H-153 en el Jetson TK1.
#
# El E3372H opera en modo HiLink: aparece como un adaptador Ethernet-sobre-USB
# con gateway en 192.168.8.1.  No requiere ppp ni wvdial.
# Este script instala las herramientas necesarias, crea una regla udev para
# asignar el nombre estable "lte0" al adaptador, y registra la conexión en
# NetworkManager.
#
# El mismo gateway (192.168.8.1) expone la API web del modem, que el
# dispatcher SMS (mango-edge-sms) usa para enviar mensajes de texto.

set -euo pipefail

GATEWAY="192.168.8.1"

echo "=== Configuracion Huawei E3372H-153 LTE ==="

# 1. Herramientas
echo "Instalando herramientas..."
apt-get install -y usb-modeswitch usb-modeswitch-data network-manager curl

# 2. Verificar presencia del dispositivo
echo ""
echo "Buscando Huawei E3372H-153 (Vendor ID 12d1)..."
if lsusb | grep -i "12d1"; then
    echo "Modem detectado."
else
    echo "ADVERTENCIA: modem no detectado. Conecta el E3372H e intenta de nuevo."
fi

# 3. Regla udev — nombre estable "lte0"
cat > /etc/udev/rules.d/99-mango-huawei.rules << 'EOF'
# Huawei E3372H-153 en modo HiLink — interfaz Ethernet sobre USB
SUBSYSTEM=="net", ATTRS{idVendor}=="12d1", NAME="lte0"
EOF

udevadm control --reload-rules
udevadm trigger
echo "Regla udev aplicada: interfaz se nombrara lte0"

# 4. Conexion NetworkManager (si NetworkManager esta disponible)
if command -v nmcli &>/dev/null; then
    nmcli connection delete mango-lte 2>/dev/null || true
    nmcli connection add \
        type ethernet \
        con-name "mango-lte" \
        ifname lte0 \
        ipv4.method auto \
        ipv6.method ignore \
        connection.autoconnect yes \
        ipv4.route-metric 100
    echo "Conexion NetworkManager 'mango-lte' registrada (metrica 100, prioridad menor que WiFi)."
else
    echo "NetworkManager no disponible — configura lte0 manualmente."
fi

# 5. Verificar conectividad HTTP al gateway del modem
echo ""
echo "=== Verificacion de conectividad con el modem ==="

# Esperar hasta 15 segundos a que lte0 suba
for i in $(seq 1 15); do
    if ip link show lte0 &>/dev/null 2>&1; then
        break
    fi
    sleep 1
done

if ip addr show lte0 2>/dev/null | grep -q "inet "; then
    echo "Interfaz lte0 activa con IP."
    echo ""
    echo "Probando API del modem (${GATEWAY})..."
    if curl -s --max-time 5 "http://${GATEWAY}/api/device/basic_information" | grep -q "DeviceName\|response"; then
        echo "API del modem accesible. El dispatcher SMS puede enviar mensajes."
    else
        echo "API del modem no respondio. Verifica que el modem este en modo HiLink."
    fi
    echo ""
    echo "Probando salida a internet via lte0..."
    if ping -c 2 -W 3 -I lte0 8.8.8.8 &>/dev/null 2>&1; then
        echo "Conectividad LTE: OK"
    else
        echo "Sin conectividad a internet por lte0 — verifica SIM y plan de datos."
    fi
else
    echo "lte0 no tiene IP asignada aun. Puede tardar unos segundos."
    echo "Ejecuta manualmente: ip addr show lte0"
fi

echo ""
echo "=== Siguientes pasos ==="
echo "  Ver interfaz:        ip addr show lte0"
echo "  Probar conectividad: ping -c 3 8.8.8.8 -I lte0"
echo "  Probar API modem:    curl http://${GATEWAY}/api/device/basic_information"
echo "  Ver logs SMS:        journalctl -u mango-edge-sms -f"
echo ""
echo "El numero del contacto de alerta se configura desde el panel admin del backend:"
echo "  POST /api/v1/alerts/contacts  { name, phone (+57...), active: true }"
echo "  POST /api/v1/alerts/rules     { sensor_type, comparison, threshold, level }"
