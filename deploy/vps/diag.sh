#!/usr/bin/env bash
# M.A.N.G.O VPS Diagnostic Script
# Usage: bash deploy/vps/diag.sh
# Reads .env.vps from the same directory as this script.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.vps"

# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

pass()  { echo -e "  ${GREEN}[PASS]${RESET} $*"; }
warn()  { echo -e "  ${YELLOW}[WARN]${RESET} $*"; WARNINGS=$((WARNINGS + 1)); }
fail()  { echo -e "  ${RED}[FAIL]${RESET} $*"; FAILURES=$((FAILURES + 1)); }
section() { echo -e "\n${BOLD}=== $* ===${RESET}"; }

FAILURES=0
WARNINGS=0

# ---------------------------------------------------------------------------
# Load .env.vps
# ---------------------------------------------------------------------------
if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    set -a; source "$ENV_FILE"; set +a
else
    echo -e "${RED}ERROR: .env.vps not found at $ENV_FILE${RESET}"
    exit 1
fi

API_PORT="${API_HOST_PORT:-8000}"
DB_USER="${DB_USER:-mango}"
DB_NAME="${DB_NAME:-mango}"

echo -e "${BOLD}M.A.N.G.O VPS Diagnostic — $(date '+%Y-%m-%d %H:%M:%S %Z')${RESET}"

# ---------------------------------------------------------------------------
# 1. System
# ---------------------------------------------------------------------------
section "System"

HOSTNAME_VAL=$(hostname 2>/dev/null || echo "unknown")
pass "Hostname: $HOSTNAME_VAL"

UPTIME_VAL=$(uptime -p 2>/dev/null || uptime)
pass "Uptime: $UPTIME_VAL"

DISK_USAGE=$(df -h / | awk 'NR==2 {print $5 " used (" $3 "/" $2 ")"}')
DISK_PCT=$(df / | awk 'NR==2 {gsub(/%/,"",$5); print $5}')
if [[ "$DISK_PCT" -ge 90 ]]; then
    fail "Disk /: $DISK_USAGE"
elif [[ "$DISK_PCT" -ge 75 ]]; then
    warn "Disk /: $DISK_USAGE"
else
    pass "Disk /: $DISK_USAGE"
fi

MEM=$(free -h | awk '/^Mem:/ {print "used " $3 " / total " $2}')
MEM_PCT=$(free | awk '/^Mem:/ {printf "%.0f", $3/$2*100}')
if [[ "$MEM_PCT" -ge 90 ]]; then
    fail "Memory: $MEM (${MEM_PCT}%)"
elif [[ "$MEM_PCT" -ge 75 ]]; then
    warn "Memory: $MEM (${MEM_PCT}%)"
else
    pass "Memory: $MEM (${MEM_PCT}%)"
fi

# ---------------------------------------------------------------------------
# 2. Docker daemon
# ---------------------------------------------------------------------------
section "Docker daemon"

if docker info &>/dev/null; then
    pass "Docker daemon is running"
else
    fail "Docker daemon is not running — remaining checks may fail"
fi

# ---------------------------------------------------------------------------
# 3. Containers
# ---------------------------------------------------------------------------
section "Containers"

for CONTAINER in mango_backend mango_db mango_redis; do
    STATUS=$(docker inspect --format '{{.State.Status}}' "$CONTAINER" 2>/dev/null || echo "missing")
    HEALTH=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$CONTAINER" 2>/dev/null || echo "missing")

    if [[ "$STATUS" == "missing" ]]; then
        fail "$CONTAINER: container not found"
    elif [[ "$STATUS" != "running" ]]; then
        fail "$CONTAINER: status=$STATUS"
    elif [[ "$HEALTH" == "unhealthy" ]]; then
        fail "$CONTAINER: running but health=$HEALTH"
    elif [[ "$HEALTH" == "starting" ]]; then
        warn "$CONTAINER: running, health=starting (still warming up)"
    else
        pass "$CONTAINER: status=$STATUS, health=$HEALTH"
    fi
done

# ---------------------------------------------------------------------------
# 4. Backend API health
# ---------------------------------------------------------------------------
section "Backend API"

HEALTH_URL="http://127.0.0.1:${API_PORT}/api/v1/health"
HTTP_CODE=$(curl -o /tmp/mango_health.json -w "%{http_code}" -fsS --max-time 5 "$HEALTH_URL" 2>/dev/null || echo "000")

if [[ "$HTTP_CODE" == "200" ]]; then
    DB_STATUS=$(python3 -c "import json,sys; d=json.load(open('/tmp/mango_health.json')); print(d.get('db','?'))" 2>/dev/null || echo "?")
    pass "GET /api/v1/health -> HTTP $HTTP_CODE (db: $DB_STATUS)"
elif [[ "$HTTP_CODE" == "503" ]]; then
    fail "GET /api/v1/health -> HTTP 503 (database degraded)"
elif [[ "$HTTP_CODE" == "000" ]]; then
    fail "GET /api/v1/health -> no response (backend not reachable on port $API_PORT)"
else
    fail "GET /api/v1/health -> unexpected HTTP $HTTP_CODE"
fi

# ---------------------------------------------------------------------------
# 5. Postgres
# ---------------------------------------------------------------------------
section "Postgres"

if docker exec mango_db pg_isready -U "$DB_USER" -d "$DB_NAME" &>/dev/null; then
    pass "pg_isready: accepting connections"
else
    fail "pg_isready: database not accepting connections"
fi

ROW_COUNT=$(docker exec mango_db psql -U "$DB_USER" -d "$DB_NAME" -tAc \
    "SELECT COUNT(*) FROM sensor_data;" 2>/dev/null || echo "error")
if [[ "$ROW_COUNT" == "error" ]]; then
    warn "Could not count rows in sensor_data (table may not exist yet)"
elif [[ "$ROW_COUNT" -eq 0 ]]; then
    warn "sensor_data table exists but has 0 rows"
else
    pass "sensor_data rows: $ROW_COUNT"
fi

# ---------------------------------------------------------------------------
# 6. Redis
# ---------------------------------------------------------------------------
section "Redis"

REDIS_PING=$(docker exec mango_redis redis-cli ping 2>/dev/null || echo "error")
if [[ "$REDIS_PING" == "PONG" ]]; then
    pass "redis-cli ping -> PONG"
else
    fail "redis-cli ping -> $REDIS_PING"
fi

# ---------------------------------------------------------------------------
# 7. Nginx
# ---------------------------------------------------------------------------
section "Nginx"

if command -v systemctl &>/dev/null; then
    NGINX_STATE=$(systemctl is-active nginx 2>/dev/null || echo "unknown")
    if [[ "$NGINX_STATE" == "active" ]]; then
        pass "nginx systemd unit: $NGINX_STATE"
    else
        fail "nginx systemd unit: $NGINX_STATE"
    fi
else
    warn "systemctl not available — skipping nginx service check"
fi

if command -v nginx &>/dev/null; then
    if nginx -t &>/dev/null; then
        pass "nginx config syntax: OK"
    else
        fail "nginx config syntax: ERRORS (run 'sudo nginx -t' for details)"
    fi
else
    warn "nginx binary not found on host — skipping config check"
fi

# ---------------------------------------------------------------------------
# 8. SSL certificate
# ---------------------------------------------------------------------------
section "SSL Certificate"

DOMAIN="${PUBLIC_BASE_URL:-}"
DOMAIN="${DOMAIN#https://}"
DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN%%/*}"

if [[ -z "$DOMAIN" ]]; then
    warn "PUBLIC_BASE_URL not set — skipping SSL check"
elif command -v openssl &>/dev/null; then
    EXPIRY=$(echo | timeout 5 openssl s_client -connect "${DOMAIN}:443" -servername "$DOMAIN" 2>/dev/null \
        | openssl x509 -noout -enddate 2>/dev/null \
        | sed 's/notAfter=//' || echo "")
    if [[ -z "$EXPIRY" ]]; then
        warn "Could not retrieve SSL certificate for $DOMAIN"
    else
        # Days until expiry
        EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$EXPIRY" +%s 2>/dev/null || echo 0)
        NOW_EPOCH=$(date +%s)
        DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
        if [[ "$DAYS_LEFT" -le 7 ]]; then
            fail "SSL certificate for $DOMAIN expires in ${DAYS_LEFT} days ($EXPIRY)"
        elif [[ "$DAYS_LEFT" -le 30 ]]; then
            warn "SSL certificate for $DOMAIN expires in ${DAYS_LEFT} days ($EXPIRY)"
        else
            pass "SSL certificate for $DOMAIN valid for ${DAYS_LEFT} more days"
        fi
    fi
else
    warn "openssl not available — skipping SSL check"
fi

# ---------------------------------------------------------------------------
# 9. Recent backend errors
# ---------------------------------------------------------------------------
section "Recent backend errors (last 50 lines)"

ERROR_LINES=$(docker logs mango_backend --tail 50 2>&1 | grep -iE "error|critical|exception|traceback" | tail -10 || true)
if [[ -z "$ERROR_LINES" ]]; then
    pass "No ERROR/CRITICAL entries in last 50 log lines"
else
    warn "Error entries found in backend logs:"
    while IFS= read -r line; do
        echo "      $line"
    done <<< "$ERROR_LINES"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo -e "${BOLD}=== Summary ===${RESET}"

if [[ "$FAILURES" -eq 0 && "$WARNINGS" -eq 0 ]]; then
    echo -e "${GREEN}All checks passed.${RESET}"
    exit 0
elif [[ "$FAILURES" -eq 0 ]]; then
    echo -e "${YELLOW}${WARNINGS} warning(s), 0 failures.${RESET}"
    exit 0
else
    echo -e "${RED}${FAILURES} failure(s), ${WARNINGS} warning(s). Review output above.${RESET}"
    exit 1
fi
