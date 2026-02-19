#!/usr/bin/env bash
set -euo pipefail

# -------------------------------
# M.A.N.G.O - Seed History v2
# - No jq
# - No locale issues (always dot decimals)
# - Attempts "ts" backfill; if API rejects, retries without "ts"
#
# Usage:
#   ./scripts/seed_history_v2.sh [HOURS_BACK] [STEP_MINUTES] [BASE_URL]
#
# Examples:
#   ./scripts/seed_history_v2.sh 144 10
#   ./scripts/seed_history_v2.sh 24 5 http://localhost:8080
# -------------------------------

HOURS_BACK="${1:-144}"
STEP_MINUTES="${2:-10}"
BASE_URL="${3:-http://localhost:8080}"
ENDPOINT="${BASE_URL%/}/api/v1/ingest"

STATION_NAME="${STATION_NAME:-MANGO Station}"
STATION_LABEL="${STATION_LABEL:-}" # opcional

# Ranges (ajústalos si quieres)
TEMP_MIN="${TEMP_MIN:-22.0}"
TEMP_MAX="${TEMP_MAX:-30.0}"
PH_MIN="${PH_MIN:-6.6}"
PH_MAX="${PH_MAX:-8.2}"
TURB_MIN="${TURB_MIN:-50.0}"
TURB_MAX="${TURB_MAX:-600.0}"

# ---- Checks
need() { command -v "$1" >/dev/null 2>&1 || { echo "[ERR] Missing: $1"; exit 1; }; }
need curl
need python3
need date

if ! [[ "$HOURS_BACK" =~ ^[0-9]+$ ]]; then
  echo "[ERR] HOURS_BACK must be integer (got: $HOURS_BACK)"; exit 1
fi
if ! [[ "$STEP_MINUTES" =~ ^[0-9]+$ ]] || [ "$STEP_MINUTES" -lt 1 ]; then
  echo "[ERR] STEP_MINUTES must be integer >=1 (got: $STEP_MINUTES)"; exit 1
fi

# Compute number of points
TOTAL_MINUTES=$(( HOURS_BACK * 60 ))
POINTS=$(( TOTAL_MINUTES / STEP_MINUTES ))
if [ "$POINTS" -lt 1 ]; then
  echo "[ERR] Computed POINTS < 1. Check HOURS_BACK and STEP_MINUTES."; exit 1
fi

echo "[INFO] Seeding history"
echo "  endpoint     = $ENDPOINT"
echo "  hours_back   = $HOURS_BACK"
echo "  step_minutes = $STEP_MINUTES"
echo "  points       = $POINTS"
echo "  station      = $STATION_NAME"
echo

# Use python for:
# - random floats with dot decimals
# - ISO timestamps (UTC) backfilled
# - JSON serialization (always valid)
PYTHON_GEN='
import sys, json, random, datetime

hours_back=int(sys.argv[1])
step_minutes=int(sys.argv[2])

temp_min=float(sys.argv[3]); temp_max=float(sys.argv[4])
ph_min=float(sys.argv[5]); ph_max=float(sys.argv[6])
turb_min=float(sys.argv[7]); turb_max=float(sys.argv[8])

station_name=sys.argv[9]
station_label=sys.argv[10]

now = datetime.datetime.now(datetime.timezone.utc)
total_minutes = hours_back*60
points = total_minutes // step_minutes
if points < 1:
    points = 1

def rf(a,b,dec):
    return round(random.uniform(a,b), dec)

for i in range(points):
    # start from oldest to newest
    minutes_ago = total_minutes - (i*step_minutes)
    ts = now - datetime.timedelta(minutes=minutes_ago)

    payload = {
        "station": {"name": station_name},
        "readings": [
            {"type":"temperature","value": rf(temp_min,temp_max,2)},
            {"type":"ph","value": rf(ph_min,ph_max,2)},
            {"type":"turbidity","value": rf(turb_min,turb_max,1)},
        ],
        # backfill timestamp (UTC)
        "ts": ts.isoformat().replace("+00:00","Z")
    }

    if station_label:
        payload["station"]["label"] = station_label

    print(json.dumps(payload, separators=(",",":")))
'

# Quick probe: does API accept "ts"?
# We send 1 minimal request with ts and see if it returns ok.
probe_payload="$(python3 - <<'PY'
import json, datetime
now=datetime.datetime.now(datetime.timezone.utc)
print(json.dumps({
  "station":{"name":"MANGO Station"},
  "readings":[{"type":"temperature","value":26.4}],
  "ts": now.isoformat().replace("+00:00","Z")
}, separators=(",",":")))
PY
)"

probe_code="$(
  curl -sS -o /tmp/mango_seed_probe.json -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -X POST "$ENDPOINT" \
    -d "$probe_payload" || true
)"

ACCEPTS_TS="no"
if [ "$probe_code" = "200" ] || [ "$probe_code" = "201" ]; then
  ACCEPTS_TS="yes"
else
  # If probe failed, we still continue with fallback (no ts).
  ACCEPTS_TS="no"
fi

echo "[INFO] Probe: API accepts ts? -> $ACCEPTS_TS (HTTP $probe_code)"
if [ -s /tmp/mango_seed_probe.json ]; then
  echo "[INFO] Probe response: $(cat /tmp/mango_seed_probe.json)"
fi
echo

# Seed loop
ok=0
fail=0
last_http=""

# Generate all payloads as lines (one JSON per line)
while IFS= read -r payload; do
  send_payload="$payload"

  if [ "$ACCEPTS_TS" = "no" ]; then
    # Remove "ts" key if API doesn't accept it
    send_payload="$(python3 - <<'PY' "$payload"
import sys, json
obj=json.loads(sys.argv[1])
obj.pop("ts", None)
print(json.dumps(obj, separators=(",",":")))
PY
)"
  fi

  http_code="$(
    curl -sS -o /tmp/mango_seed_resp.json -w "%{http_code}" \
      -H "Content-Type: application/json" \
      -X POST "$ENDPOINT" \
      -d "$send_payload" || true
  )"

  last_http="$http_code"

  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    ok=$((ok+1))
  else
    fail=$((fail+1))
    echo "[WARN] HTTP $http_code for payload:"
    echo "       $send_payload"
    if [ -s /tmp/mango_seed_resp.json ]; then
      echo "       resp: $(cat /tmp/mango_seed_resp.json)"
    fi
    # If API rejected ts unexpectedly mid-run, force fallback and retry once
    if [ "$ACCEPTS_TS" = "yes" ]; then
      echo "[WARN] Retrying without ts..."
      retry_payload="$(python3 - <<'PY' "$payload"
import sys, json
obj=json.loads(sys.argv[1])
obj.pop("ts", None)
print(json.dumps(obj, separators=(",",":")))
PY
)"
      http_code2="$(
        curl -sS -o /tmp/mango_seed_resp2.json -w "%{http_code}" \
          -H "Content-Type: application/json" \
          -X POST "$ENDPOINT" \
          -d "$retry_payload" || true
      )"
      if [ "$http_code2" = "200" ] || [ "$http_code2" = "201" ]; then
        ok=$((ok+1))
        echo "[INFO] Retry OK (without ts)"
        ACCEPTS_TS="no"
      else
        echo "[ERR] Retry failed HTTP $http_code2"
        if [ -s /tmp/mango_seed_resp2.json ]; then
          echo "      resp: $(cat /tmp/mango_seed_resp2.json)"
        fi
      fi
    fi
  fi
done < <(
  python3 -c "$PYTHON_GEN" \
    "$HOURS_BACK" "$STEP_MINUTES" \
    "$TEMP_MIN" "$TEMP_MAX" \
    "$PH_MIN" "$PH_MAX" \
    "$TURB_MIN" "$TURB_MAX" \
    "$STATION_NAME" "$STATION_LABEL"
)

echo
echo "[DONE] ok=$ok fail=$fail (last_http=$last_http)"
echo "[NEXT] Verify:"
echo "  curl -fsS \"${BASE_URL%/}/api/v1/latest?limit=10\" && echo"
