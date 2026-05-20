#!/usr/bin/env bash
# Despliega codigo actualizado en el Jetson despues de un git pull.
# No reinstala dependencias ni sobreescribe .env.
# Ejecutar como root o con sudo desde el directorio raiz del repo.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INSTALL_DIR="/opt/mango_node"
SERVICES=(mango-edge-serial mango-edge-sync mango-edge-api mango-edge-sms)

echo "=== M.A.N.G.O. Jetson Update ==="
echo "Repo:    $REPO_ROOT"
echo "Install: $INSTALL_DIR"

# Detectar init system
if command -v systemctl &>/dev/null && systemctl --version &>/dev/null 2>&1; then
    INIT_SYSTEM="systemd"
elif [ -d /etc/init ] && command -v initctl &>/dev/null; then
    INIT_SYSTEM="upstart"
else
    INIT_SYSTEM="none"
fi
echo "Init:    $INIT_SYSTEM"

# Copiar codigo preservando .env existente
echo "Copiando codigo..."
if [ -f "$INSTALL_DIR/.env" ]; then
    cp "$INSTALL_DIR/.env" /tmp/mango_node_env_backup
fi

cp -r "$REPO_ROOT/opt/mango_node/." "$INSTALL_DIR/"
chown -R mango:mango "$INSTALL_DIR"

if [ -f /tmp/mango_node_env_backup ]; then
    mv /tmp/mango_node_env_backup "$INSTALL_DIR/.env"
    chown mango:mango "$INSTALL_DIR/.env"
    chmod 640 "$INSTALL_DIR/.env"
fi

# Reiniciar servicios
echo "Reiniciando servicios..."

if [ "$INIT_SYSTEM" = "systemd" ]; then
    for svc in "${SERVICES[@]}"; do
        if systemctl is-active --quiet "$svc" 2>/dev/null; then
            systemctl restart "$svc"
            echo "  Reiniciado: $svc"
        fi
    done

elif [ "$INIT_SYSTEM" = "upstart" ]; then
    # Detener en orden inverso de dependencias, iniciar serial primero.
    # initctl es explicito para no depender del PATH de sudo.
    initctl stop mango-edge-sms    2>/dev/null || true
    initctl stop mango-edge-sync   2>/dev/null || true
    initctl stop mango-edge-api    2>/dev/null || true
    initctl stop mango-edge-serial 2>/dev/null || true
    echo "  Servicios detenidos."

    initctl start mango-edge-serial 2>/dev/null || true
    initctl start mango-edge-api    2>/dev/null || true
    initctl start mango-edge-sync   2>/dev/null || true
    initctl start mango-edge-sms    2>/dev/null || true
    echo "  Servicios iniciados."

else
    echo ""
    echo "Init system no reconocido. Reinicia los procesos manualmente."
    echo "Codigo actualizado en $INSTALL_DIR"
    exit 0
fi

echo ""
echo "=== Actualizacion completa ==="
if [ "$INIT_SYSTEM" = "upstart" ]; then
    echo "Estado de servicios:"
    for svc in "${SERVICES[@]}"; do
        initctl status "$svc" 2>/dev/null || true
    done
    echo ""
    echo "Logs:"
    echo "  sudo tail -f /var/log/upstart/mango-edge-serial.log"
    echo "  sudo tail -f /var/log/upstart/mango-edge-sync.log"
elif [ "$INIT_SYSTEM" = "systemd" ]; then
    systemctl status "${SERVICES[@]}" --no-pager 2>/dev/null || true
    echo ""
    echo "Logs:"
    echo "  journalctl -u mango-edge-serial -f"
    echo "  journalctl -u mango-edge-sync -f"
fi
