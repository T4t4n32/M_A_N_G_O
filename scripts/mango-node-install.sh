#!/usr/bin/env bash
# mango-node-install.sh — Deploy MANGO node stack on Jetson TK1
# Usage:  sudo bash mango-node-install.sh
# Re-run to update an existing installation (services are restarted).

set -euo pipefail

INSTALL_DIR=/opt/mango_node
SERVICES_DIR=/etc/systemd/system
UDEV_DIR=/etc/udev/rules.d
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVICES=(
    mango-node-serial
    mango-node-sync
    mango-node-sms
    mango-node-local
    mango-node-modem
)

info()  { echo "[install]  $*"; }
ok()    { echo "[install]  OK  $*"; }
warn()  { echo "[install]  WARN $*" >&2; }
die()   { echo "[install]  ERROR: $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run as root: sudo bash $0"

# ── Python environment check ──────────────────────────────────────────────────
info "Checking Python 3..."
python3 --version || die "python3 not found"

info "Installing Python dependencies..."
pip3 install --quiet pyserial requests 2>/dev/null || \
    pip install --quiet pyserial requests 2>/dev/null || \
    warn "pip install failed — install pyserial requests manually"

# ── Copy source ───────────────────────────────────────────────────────────────
info "Installing mango_node package to $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"
cp -r "$REPO_ROOT/opt/mango_node/." "$INSTALL_DIR/"
# Make the directory a proper package install root
if [[ ! -f "$INSTALL_DIR/__init__.py" ]]; then
    touch "$INSTALL_DIR/__init__.py"
fi
# Create parent package symlink so 'python3 -m mango_node.*' works
PARENT_DIR="$(dirname "$INSTALL_DIR")"
if [[ ! -L "$PARENT_DIR/mango_node" ]] && [[ ! -d "$PARENT_DIR/mango_node" ]]; then
    ln -sf "$INSTALL_DIR" "$PARENT_DIR/mango_node"
fi
ok "Source installed"

# ── Environment file ──────────────────────────────────────────────────────────
if [[ ! -f "$INSTALL_DIR/.env" ]]; then
    cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
    warn ".env created from .env.example — edit $INSTALL_DIR/.env before starting services"
else
    info ".env already exists — skipping (edit manually to update)"
fi

# ── Database directory ────────────────────────────────────────────────────────
mkdir -p "$INSTALL_DIR"
ok "Data directory ready"

# ── udev rules ────────────────────────────────────────────────────────────────
info "Installing udev rule for Huawei E3372H-153..."
cp "$REPO_ROOT/scripts/40-huawei-e3372h.rules" "$UDEV_DIR/40-huawei-e3372h.rules"
udevadm control --reload-rules
udevadm trigger --subsystem-match=usb || true
ok "udev rule installed"

# ── Systemd services ──────────────────────────────────────────────────────────
info "Installing systemd services..."
for SVC in "${SERVICES[@]}"; do
    SRC="$INSTALL_DIR/services/${SVC}.service"
    DST="$SERVICES_DIR/${SVC}.service"
    if [[ ! -f "$SRC" ]]; then
        warn "Service file not found: $SRC — skipping"
        continue
    fi
    cp "$SRC" "$DST"
    ok "  ${SVC}.service installed"
done

systemctl daemon-reload

for SVC in "${SERVICES[@]}"; do
    if [[ -f "$SERVICES_DIR/${SVC}.service" ]]; then
        systemctl enable "$SVC" 2>/dev/null || true
    fi
done
ok "Services enabled"

# ── Serial port permissions ───────────────────────────────────────────────────
info "Checking serial port permissions..."
if getent group dialout > /dev/null 2>&1; then
    CURRENT_USER="${SUDO_USER:-root}"
    if [[ "$CURRENT_USER" != "root" ]]; then
        usermod -aG dialout "$CURRENT_USER" 2>/dev/null || true
        ok "Added $CURRENT_USER to dialout group"
    fi
fi

# ── Modem status directory ────────────────────────────────────────────────────
mkdir -p "$INSTALL_DIR"
chown root:root "$INSTALL_DIR" 2>/dev/null || true

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  MANGO node installation complete"
echo ""
echo "  Next steps:"
echo "  1. Edit $INSTALL_DIR/.env with your station name, API key, etc."
echo "  2. Plug in the Huawei E3372H-153 with SIM inserted."
echo "  3. Verify LTE interface: ip link show"
echo "  4. Start services:"
echo "       sudo systemctl start mango-node-serial"
echo "       sudo systemctl start mango-node-sync"
echo "       sudo systemctl start mango-node-sms"
echo "       sudo systemctl start mango-node-local"
echo "       sudo systemctl start mango-node-modem"
echo "  5. Check status:  journalctl -u mango-node-modem -f"
echo "  6. Local API:     curl http://localhost:9100/edge/modem"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
