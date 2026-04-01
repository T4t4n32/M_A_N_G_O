#!/usr/bin/env bash
# Instala M.A.N.G.O. edge node en el Jetson TK1
# Ejecutar como root o con sudo

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INSTALL_DIR="/opt/mango_node"
USER="mango"

echo "=== M.A.N.G.O. Jetson Edge Install ==="

# 1. Crear usuario de servicio si no existe
id "$USER" &>/dev/null || useradd -r -s /bin/false -d "$INSTALL_DIR" "$USER"

# 2. Crear directorio
mkdir -p "$INSTALL_DIR"
chown "$USER:$USER" "$INSTALL_DIR"

# 3. Copiar código
cp -r "$REPO_ROOT/opt/mango_node/." "$INSTALL_DIR/"

# 4. Instalar dependencias Python
apt-get install -y python3-pip python3-serial
pip3 install pyserial requests --break-system-packages 2>/dev/null || \
  pip3 install pyserial requests

# 5. Copiar .env
if [ ! -f "$INSTALL_DIR/.env" ]; then
    cp "$REPO_ROOT/deploy/edge-jetson/.env.edge" "$INSTALL_DIR/.env"
    echo "IMPORTANTE: edita $INSTALL_DIR/.env con tus valores reales"
fi

# 6. Permisos serial (agregar usuario al grupo dialout)
usermod -aG dialout "$USER" || true

# 7. Instalar servicios systemd
SYSTEMD_DIR="$REPO_ROOT/deploy/edge-jetson/systemd"
for svc in mango-edge-serial mango-edge-sync mango-edge-api; do
    if [ -f "$SYSTEMD_DIR/${svc}.service" ]; then
        cp "$SYSTEMD_DIR/${svc}.service" "/etc/systemd/system/"
        echo "Instalado: ${svc}.service"
    fi
done

systemctl daemon-reload

# 8. Habilitar e iniciar
systemctl enable --now mango-edge-serial mango-edge-sync
echo "Servicios iniciados."

echo ""
echo "=== Post-instalación ==="
echo "1. Editar: sudo nano $INSTALL_DIR/.env"
echo "2. Ver logs serial:  journalctl -u mango-edge-serial -f"
echo "3. Ver logs sync:    journalctl -u mango-edge-sync -f"
echo "4. API local:        http://$(hostname -I | awk '{print $1}'):9100/health"