#!/usr/bin/env bash
# Instala M.A.N.G.O. edge node en el Jetson TK1
# Ejecutar como root o con sudo

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INSTALL_DIR="/opt/mango_node"
USER="mango"
SYSTEMD_DIR="$REPO_ROOT/deploy/edge-jetson/systemd"

echo "=== M.A.N.G.O. Jetson Edge Install ==="
echo "Repo:    $REPO_ROOT"
echo "Install: $INSTALL_DIR"

# 1. Crear usuario de servicio si no existe
id "$USER" &>/dev/null || useradd -r -s /bin/false -d "$INSTALL_DIR" "$USER"

# 2. Crear directorio de instalación
mkdir -p "$INSTALL_DIR"
chown "$USER:$USER" "$INSTALL_DIR"

# 3. Copiar código del nodo
cp -r "$REPO_ROOT/opt/mango_node/." "$INSTALL_DIR/"
chown -R "$USER:$USER" "$INSTALL_DIR"

# 4. Instalar dependencias Python
echo "Instalando dependencias Python..."
apt-get install -y python3-pip python3-serial python3-requests 2>/dev/null || true
pip3 install pyserial requests --break-system-packages 2>/dev/null || \
  pip3 install pyserial requests

# 5. Copiar archivo .env si no existe
ENV_EXAMPLE="$REPO_ROOT/deploy/edge-jetson/.env.edge.example"
if [ ! -f "$INSTALL_DIR/.env" ]; then
    if [ -f "$ENV_EXAMPLE" ]; then
        cp "$ENV_EXAMPLE" "$INSTALL_DIR/.env"
    fi
    echo ""
    echo "IMPORTANTE: Edita $INSTALL_DIR/.env con los valores reales antes de iniciar."
    echo "  sudo nano $INSTALL_DIR/.env"
    echo ""
fi

# 6. Permisos de puerto serial (agregar usuario al grupo dialout)
usermod -aG dialout "$USER" || true

# 7. Instalar servicios systemd
SERVICES=(mango-edge-serial mango-edge-sync mango-edge-api mango-edge-sms)
for svc in "${SERVICES[@]}"; do
    SVC_FILE="$SYSTEMD_DIR/${svc}.service"
    if [ -f "$SVC_FILE" ]; then
        cp "$SVC_FILE" "/etc/systemd/system/"
        echo "Instalado: ${svc}.service"
    fi
done

systemctl daemon-reload

# 8. Habilitar e iniciar servicios core
systemctl enable --now mango-edge-serial mango-edge-sync
echo "Servicios serial y sync iniciados."

# 9. SMS dispatcher — habilitar solo si el modem Huawei está presente
HUAWEI_PRESENT=0
if lsusb 2>/dev/null | grep -qi "12d1"; then
    HUAWEI_PRESENT=1
fi

if [ "$HUAWEI_PRESENT" -eq 1 ]; then
    systemctl enable --now mango-edge-sms
    echo "Modem Huawei detectado — servicio SMS habilitado."
else
    systemctl enable mango-edge-sms
    echo "Modem Huawei NO detectado — servicio SMS habilitado pero no iniciado."
    echo "Conéctalo y ejecuta: sudo systemctl start mango-edge-sms"
fi

echo ""
echo "=== Post-instalación ==="
echo "1. Editar config:        sudo nano $INSTALL_DIR/.env"
echo "2. Ver logs serial:      journalctl -u mango-edge-serial -f"
echo "3. Ver logs sync:        journalctl -u mango-edge-sync -f"
echo "4. Ver logs SMS:         journalctl -u mango-edge-sms -f"
echo "5. Configurar modem LTE: sudo bash $REPO_ROOT/deploy/edge-jetson/setup_huawei_lte.sh"
echo "6. API local:            http://\$(hostname -I | awk '{print \$1}'):9100/health"
