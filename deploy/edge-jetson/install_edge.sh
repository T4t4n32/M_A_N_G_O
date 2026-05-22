#!/usr/bin/env bash
# M.A.N.G.O. Edge — clean install script for Jetson TK1 (Ubuntu 14.04 / Upstart)
# Run as root: sudo bash deploy/edge-jetson/install_edge.sh
#
# What it does:
#   1. Creates /opt/mango/ directory structure
#   2. Copies edge/ code from repo
#   3. Installs Python dependencies
#   4. Copies .env template if no .env exists
#   5. Installs Upstart service configs
#   6. Starts all services

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INSTALL_DIR="/opt/mango"
EDGE_SRC="$REPO_ROOT/edge"
UPSTART_DIR="$REPO_ROOT/deploy/edge-jetson/upstart"
EDGE_USER="${SUDO_USER:-ubuntu}"

SERVICES=(mango-edge-api mango-edge-serial mango-edge-sync mango-mission mango-tunnel)

echo "=== M.A.N.G.O. Edge Install ==="
echo "Repo:    $REPO_ROOT"
echo "Install: $INSTALL_DIR"
echo "User:    $EDGE_USER"
echo ""

# 1. Directory structure
mkdir -p "$INSTALL_DIR/edge"
mkdir -p "$INSTALL_DIR/missions"
mkdir -p /var/log/mango
chown -R "$EDGE_USER:$EDGE_USER" "$INSTALL_DIR" /var/log/mango

# 2. Copy edge code
echo "[1/5] Copying edge code..."
rsync -a --delete \
    --exclude="__pycache__" \
    --exclude="*.pyc" \
    --exclude=".env" \
    "$EDGE_SRC/" "$INSTALL_DIR/edge/"
chown -R "$EDGE_USER:$EDGE_USER" "$INSTALL_DIR/edge"

# 3. Python dependencies
echo "[2/5] Installing Python dependencies..."
pip3 install flask pyserial 2>/dev/null || \
    pip install flask pyserial 2>/dev/null || \
    echo "  WARNING: pip install failed — install flask + pyserial manually"

# 4. .env file
echo "[3/5] Setting up .env..."
if [ ! -f "$INSTALL_DIR/.env" ]; then
    cp "$REPO_ROOT/deploy/edge-jetson/.env.edge.template" "$INSTALL_DIR/.env"
    chown "$EDGE_USER:$EDGE_USER" "$INSTALL_DIR/.env"
    chmod 640 "$INSTALL_DIR/.env"
    echo "  Created $INSTALL_DIR/.env — EDIT IT before starting services!"
    echo "  Required fields: INGEST_API_KEY, DEVICE_ID, VPS_URL"
else
    echo "  Existing .env preserved."
fi

# 5. Upstart configs
echo "[4/5] Installing Upstart configs..."
for svc in mango-edge-api mango-edge-serial mango-edge-sync mango-mission mango-tunnel; do
    if [ -f "$UPSTART_DIR/${svc}.conf" ]; then
        cp "$UPSTART_DIR/${svc}.conf" "/etc/init/"
        echo "  Installed: /etc/init/${svc}.conf"
    fi
done
initctl reload-configuration 2>/dev/null || true

# 6. Start services
echo "[5/5] Starting services..."
for svc in "${SERVICES[@]}"; do
    initctl stop "$svc" 2>/dev/null || true
done
sleep 1
initctl start mango-tunnel     2>/dev/null || true
initctl start mango-edge-api   2>/dev/null || true
sleep 2
initctl start mango-edge-serial 2>/dev/null || true
initctl start mango-edge-sync  2>/dev/null || true
initctl start mango-mission    2>/dev/null || true

echo ""
echo "=== Install complete ==="
echo ""
echo "Service status:"
for svc in "${SERVICES[@]}"; do
    initctl status "$svc" 2>/dev/null || echo "  $svc: not running"
done
echo ""
echo "Logs:"
echo "  sudo tail -f /var/log/upstart/mango-edge-api.log"
echo "  sudo tail -f /var/log/upstart/mango-edge-serial.log"
echo "  sudo tail -f /var/log/upstart/mango-edge-sync.log"
echo "  sudo tail -f /var/log/upstart/mango-mission.log"
echo ""
echo "Test edge API:"
echo "  curl http://localhost:9100/health"
echo "  curl http://localhost:9100/status"
