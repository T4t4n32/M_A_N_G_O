#!/usr/bin/env bash
# Instala M.A.N.G.O. edge node en el Jetson TK1 / Nano / Xavier
# Ejecutar como root o con sudo
#
# Detecta automáticamente el init system (systemd o Upstart) y
# instala los archivos de servicio correspondientes.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INSTALL_DIR="/opt/mango_node"
USER="mango"
SYSTEMD_DIR="$REPO_ROOT/deploy/edge-jetson/systemd"
UPSTART_DIR="$REPO_ROOT/deploy/edge-jetson/upstart"
SERVICES=(mango-edge-serial mango-edge-sync mango-edge-api mango-edge-sms)

echo "=== M.A.N.G.O. Jetson Edge Install ==="
echo "Repo:    $REPO_ROOT"
echo "Install: $INSTALL_DIR"

# -- Detectar init system --------------------------------------------------
if command -v systemctl &>/dev/null && systemctl --version &>/dev/null 2>&1; then
    INIT_SYSTEM="systemd"
elif [ -d /etc/init ] && command -v initctl &>/dev/null; then
    INIT_SYSTEM="upstart"
else
    INIT_SYSTEM="none"
fi
echo "Init:    $INIT_SYSTEM"

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
  pip3 install pyserial requests 2>/dev/null || true

# 5. Copiar archivo .env si no existe
ENV_EXAMPLE="$REPO_ROOT/deploy/edge-jetson/.env.edge.example"
if [ ! -f "$INSTALL_DIR/.env" ]; then
    if [ -f "$ENV_EXAMPLE" ]; then
        cp "$ENV_EXAMPLE" "$INSTALL_DIR/.env"
        chown "$USER:$USER" "$INSTALL_DIR/.env"
        chmod 640 "$INSTALL_DIR/.env"
    fi
    echo ""
    echo "IMPORTANTE: Edita $INSTALL_DIR/.env con los valores reales antes de iniciar."
    echo "  sudo nano $INSTALL_DIR/.env"
    echo ""
fi

# 6. Permisos de puerto serial
usermod -aG dialout "$USER" 2>/dev/null || true

# 7. Detectar modem Huawei
HUAWEI_PRESENT=0
if lsusb 2>/dev/null | grep -qi "12d1"; then
    HUAWEI_PRESENT=1
fi

# ------------------------------------------------------------------
# 8a. systemd
# ------------------------------------------------------------------
if [ "$INIT_SYSTEM" = "systemd" ]; then
    for svc in "${SERVICES[@]}"; do
        SVC_FILE="$SYSTEMD_DIR/${svc}.service"
        if [ -f "$SVC_FILE" ]; then
            cp "$SVC_FILE" "/etc/systemd/system/"
            echo "Instalado: ${svc}.service"
        fi
    done

    systemctl daemon-reload
    systemctl enable --now mango-edge-serial mango-edge-sync mango-edge-api
    echo "Servicios serial, sync y api iniciados."

    if [ "$HUAWEI_PRESENT" -eq 1 ]; then
        systemctl enable --now mango-edge-sms
        echo "Modem Huawei detectado — servicio SMS habilitado."
    else
        systemctl enable mango-edge-sms
        echo "Modem Huawei no detectado — SMS habilitado, no iniciado."
        echo "Conéctalo y ejecuta: sudo systemctl start mango-edge-sms"
    fi

# ------------------------------------------------------------------
# 8b. Upstart (Ubuntu 14.04 / Jetson TK1)
# ------------------------------------------------------------------
elif [ "$INIT_SYSTEM" = "upstart" ]; then
    for svc in "${SERVICES[@]}"; do
        CONF_FILE="$UPSTART_DIR/${svc}.conf"
        if [ -f "$CONF_FILE" ]; then
            cp "$CONF_FILE" "/etc/init/"
            echo "Instalado: ${svc}.conf"
        fi
    done

    initctl reload-configuration

    start mango-edge-serial 2>/dev/null || true
    start mango-edge-sync   2>/dev/null || true
    start mango-edge-api    2>/dev/null || true
    echo "Servicios serial, sync y api iniciados."

    if [ "$HUAWEI_PRESENT" -eq 1 ]; then
        start mango-edge-sms 2>/dev/null || true
        echo "Modem Huawei detectado — servicio SMS iniciado."
    else
        echo "Modem Huawei no detectado — SMS registrado pero no iniciado."
        echo "Conéctalo y ejecuta: sudo start mango-edge-sms"
    fi

# ------------------------------------------------------------------
# 8c. Sin init conocido — instrucciones manuales
# ------------------------------------------------------------------
else
    echo ""
    echo "ADVERTENCIA: init system no reconocido."
    echo "Inicia los procesos manualmente:"
    echo "  sudo -u $USER bash -c 'set -a; . $INSTALL_DIR/.env; set +a; python3 -m mango_node.serial_acquire' &"
    echo "  sudo -u $USER bash -c 'set -a; . $INSTALL_DIR/.env; set +a; python3 -m mango_node.sync_manager' &"
    echo "  sudo -u $USER bash -c 'set -a; . $INSTALL_DIR/.env; set +a; python3 -m mango_node.local_api' &"
fi

echo ""
echo "=== Post-instalación ==="
echo "1. Editar config:"
echo "     sudo nano $INSTALL_DIR/.env"
if [ "$INIT_SYSTEM" = "systemd" ]; then
echo "2. Ver logs serial:      journalctl -u mango-edge-serial -f"
echo "3. Ver logs sync:        journalctl -u mango-edge-sync -f"
echo "4. Ver logs API:         journalctl -u mango-edge-api -f"
echo "5. Estado servicios:     sudo systemctl status mango-edge-serial mango-edge-sync mango-edge-api"
elif [ "$INIT_SYSTEM" = "upstart" ]; then
echo "2. Ver logs serial:      sudo tail -f /var/log/upstart/mango-edge-serial.log"
echo "3. Ver logs sync:        sudo tail -f /var/log/upstart/mango-edge-sync.log"
echo "4. Ver logs API:         sudo tail -f /var/log/upstart/mango-edge-api.log"
echo "5. Estado servicios:     sudo initctl status mango-edge-serial"
fi
echo "6. Configurar modem LTE: sudo bash $REPO_ROOT/deploy/edge-jetson/setup_huawei_lte.sh"
echo "7. API local:            http://\$(hostname -I | awk '{print \$1}'):9100/health"
