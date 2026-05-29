#!/usr/bin/env bash
# mango-node-install.sh — Deploy MANGO node stack on Jetson TK1 (Ubuntu 14.04)
# Also works on any Debian/Ubuntu system with systemd.
# Usage: sudo bash scripts/mango-node-install.sh
# Re-run to update an existing installation.

set -euo pipefail

INSTALL_DIR=/opt/mango_node
UDEV_DIR=/etc/udev/rules.d
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVICES=(
    mango-node-serial
    mango-node-sync
    mango-node-sms
    mango-node-local
    mango-node-modem
)

info() { echo "[install]  $*"; }
ok()   { echo "[install]  OK  $*"; }
warn() { echo "[install]  WARN $*" >&2; }
die()  { echo "[install]  ERROR: $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run as root: sudo bash $0"

# ── Detect init system ────────────────────────────────────────────────────────
if command -v systemctl > /dev/null 2>&1 && systemctl --version > /dev/null 2>&1; then
    INIT_SYSTEM="systemd"
elif command -v initctl > /dev/null 2>&1; then
    INIT_SYSTEM="upstart"
else
    INIT_SYSTEM="sysv"
fi
info "Init system detected: $INIT_SYSTEM"

# ── Python check ──────────────────────────────────────────────────────────────
info "Checking Python 3..."
python3 --version || die "python3 not found"

info "Installing Python dependencies (pyserial, requests)..."
if command -v pip3 > /dev/null 2>&1; then
    pip3 install --quiet pyserial requests 2>/dev/null \
        && ok "Dependencies installed via pip3" \
        || warn "pip3 install failed — install pyserial requests manually"
elif command -v pip > /dev/null 2>&1; then
    pip install --quiet pyserial requests 2>/dev/null \
        && ok "Dependencies installed via pip" \
        || warn "pip install failed — install pyserial requests manually"
else
    warn "pip not found — install pyserial requests manually before starting services"
fi

# ── Copy source ───────────────────────────────────────────────────────────────
info "Installing mango_node package to $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"
cp -r "$REPO_ROOT/opt/mango_node/." "$INSTALL_DIR/"
ok "Source installed"

# The package must be importable as 'mango_node' from /opt.
# Test: python3 -c "import sys; sys.path.insert(0,'/opt'); import mango_node"
# WorkingDirectory=/opt in all service files achieves this automatically.

# ── Environment file ──────────────────────────────────────────────────────────
if [[ ! -f "$INSTALL_DIR/.env" ]]; then
    cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
    warn ".env created from .env.example"
    warn "Edit $INSTALL_DIR/.env before starting services!"
else
    info ".env already exists — skipping (edit manually to update)"
fi

# ── udev rule ─────────────────────────────────────────────────────────────────
info "Installing udev rule for Huawei E3372H-153..."
cp "$REPO_ROOT/scripts/40-huawei-e3372h.rules" "$UDEV_DIR/40-huawei-e3372h.rules"
udevadm control --reload-rules 2>/dev/null || true
udevadm trigger --subsystem-match=usb 2>/dev/null || true
ok "udev rule installed"

# ── Services ──────────────────────────────────────────────────────────────────
info "Installing services ($INIT_SYSTEM)..."

if [[ "$INIT_SYSTEM" == "upstart" ]]; then
    UPSTART_DIR=/etc/init
    for SVC in "${SERVICES[@]}"; do
        SRC="$INSTALL_DIR/services/${SVC}.conf"
        DST="$UPSTART_DIR/${SVC}.conf"
        if [[ ! -f "$SRC" ]]; then
            warn "  ${SVC}.conf not found — skipping"; continue
        fi
        cp "$SRC" "$DST"
        ok "  ${SVC}.conf -> $DST"
    done
    initctl reload-configuration 2>/dev/null || true
    ok "Upstart configuration reloaded"

elif [[ "$INIT_SYSTEM" == "systemd" ]]; then
    SYSTEMD_DIR=/etc/systemd/system
    for SVC in "${SERVICES[@]}"; do
        SRC="$INSTALL_DIR/services/${SVC}.service"
        DST="$SYSTEMD_DIR/${SVC}.service"
        if [[ ! -f "$SRC" ]]; then
            warn "  ${SVC}.service not found — skipping"; continue
        fi
        cp "$SRC" "$DST"
        ok "  ${SVC}.service -> $DST"
    done
    systemctl daemon-reload
    for SVC in "${SERVICES[@]}"; do
        [[ -f "/etc/systemd/system/${SVC}.service" ]] && systemctl enable "$SVC" 2>/dev/null || true
    done
    ok "systemd services enabled"

else
    warn "Unknown init system — services NOT installed automatically"
    warn "Copy the appropriate .conf or .service files from $INSTALL_DIR/services/ manually"
fi

# ── Serial port group ─────────────────────────────────────────────────────────
CURRENT_USER="${SUDO_USER:-}"
if [[ -n "$CURRENT_USER" ]] && [[ "$CURRENT_USER" != "root" ]]; then
    if getent group dialout > /dev/null 2>&1; then
        usermod -aG dialout "$CURRENT_USER" 2>/dev/null \
            && ok "Added $CURRENT_USER to dialout group (re-login to apply)" || true
    fi
fi

# ── Quick import test ─────────────────────────────────────────────────────────
info "Testing Python import..."
if python3 -c "import sys; sys.path.insert(0,'/opt'); from mango_node import config" 2>/dev/null; then
    ok "mango_node package imports correctly from /opt"
else
    warn "Import test failed — check PYTHONPATH or package layout"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  MANGO node installation complete ($INIT_SYSTEM)"
echo ""
echo "  Next steps:"
echo "  1. Edit $INSTALL_DIR/.env (API key, station name, serial port)"
echo "  2. Plug in the Huawei E3372H-153 with SIM inserted"
echo "  3. Verify LTE interface:  ip link show | grep -E 'usb|eth'"
if [[ "$INIT_SYSTEM" == "upstart" ]]; then
echo ""
echo "  Start services:"
echo "    sudo start mango-node-local"
echo "    sudo start mango-node-serial"
echo "    sudo start mango-node-sync"
echo "    sudo start mango-node-sms"
echo "    sudo start mango-node-modem"
echo ""
echo "  Check logs:"
echo "    tail -f /var/log/upstart/mango-node-modem.log"
echo "    tail -f /var/log/upstart/mango-node-sync.log"
echo ""
echo "  Stop a service:"
echo "    sudo stop mango-node-modem"
elif [[ "$INIT_SYSTEM" == "systemd" ]]; then
echo ""
echo "  Start services:"
echo "    sudo systemctl start mango-node-local mango-node-serial \\"
echo "      mango-node-sync mango-node-sms mango-node-modem"
echo ""
echo "  Check logs:  journalctl -u mango-node-modem -f"
fi
echo ""
echo "  Local API (once mango-node-local is running):"
echo "    curl http://localhost:9100/edge/modem"
echo "    curl http://localhost:9100/edge/sync-status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
