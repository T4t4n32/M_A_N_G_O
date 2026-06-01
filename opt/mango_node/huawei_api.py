"""HTTP client for the Huawei E3372H-153 HiLink modem web API.

The E3372H in HiLink mode exposes a REST-like API at its default
gateway (192.168.8.1). Authentication uses a session cookie and a
CSRF token obtained from /api/webserver/SesTokInfo.
"""

import xml.etree.ElementTree as ET
from datetime import datetime, timezone

import requests

_DEFAULT_GATEWAY = "192.168.8.1"
_SESSION_TIMEOUT = 10


def _gateway_url(gateway, path):
    return "http://{}{}".format(gateway, path)


def _get_session_token(gateway):
    """Return (SessionID, TokInfo) from the modem."""
    url = _gateway_url(gateway, "/api/webserver/SesTokInfo")
    resp = requests.get(url, timeout=_SESSION_TIMEOUT)
    resp.raise_for_status()

    root = ET.fromstring(resp.text)
    ses = root.findtext("SesInfo") or ""
    tok = root.findtext("TokInfo") or ""
    if not ses or not tok:
        raise ValueError("unexpected SesTokInfo response: {}".format(resp.text[:200]))
    return ses, tok


def _build_sms_xml(phone, message):
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    length = len(message)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<request>"
        "<Index>-1</Index>"
        "<Phones><Phone>{}</Phone></Phones>".format(phone) +
        "<Sca></Sca>"
        "<Content>{}</Content>".format(message) +
        "<Length>{}</Length>".format(length) +
        "<Reserved>1</Reserved>"
        "<Date>{}</Date>".format(now) +
        "</request>"
    )


def send_sms(phone, message, gateway=_DEFAULT_GATEWAY):
    """Send an SMS via the Huawei HiLink API.

    Returns (success, error_message). error_message is None on success.
    """
    try:
        ses, tok = _get_session_token(gateway)
    except Exception as exc:
        return False, "token fetch failed: {}".format(exc)

    url = _gateway_url(gateway, "/api/sms/send-sms")
    headers = {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Cookie": ses,
        "__RequestVerificationToken": tok,
    }
    body = _build_sms_xml(phone, message[:160])

    try:
        resp = requests.post(url, data=body, headers=headers, timeout=_SESSION_TIMEOUT)
        resp.raise_for_status()
    except Exception as exc:
        return False, "send request failed: {}".format(exc)

    try:
        root = ET.fromstring(resp.text)
        if root.text and root.text.strip().upper() == "OK":
            return True, None
        err_code = root.findtext("code") or root.text or resp.text[:100]
        return False, "modem error: {}".format(err_code)
    except ET.ParseError:
        return False, "unparseable modem response: {}".format(resp.text[:100])


def modem_available(gateway=_DEFAULT_GATEWAY):
    """Return True if the modem web API is reachable."""
    try:
        requests.get(_gateway_url(gateway, "/api/device/basic_information"), timeout=3)
        return True
    except Exception:
        return False


def _modem_reachable(gateway=_DEFAULT_GATEWAY):
    """Return (reachable: bool, error: str|None)."""
    try:
        requests.get(_gateway_url(gateway, "/api/device/basic_information"), timeout=3)
        return True, None
    except Exception as exc:
        return False, str(exc)


def get_inbox(gateway=_DEFAULT_GATEWAY):
    """Return received SMS messages from the modem inbox."""
    try:
        ses, tok = _get_session_token(gateway)
    except Exception:
        return []

    url = _gateway_url(gateway, "/api/sms/sms-list")
    headers = {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Cookie": ses,
        "__RequestVerificationToken": tok,
    }
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<request>"
        "<PageIndex>1</PageIndex>"
        "<ReadCount>20</ReadCount>"
        "<BoxType>1</BoxType>"
        "<SortType>0</SortType>"
        "<Ascending>0</Ascending>"
        "<UnreadPreferred>1</UnreadPreferred>"
        "</request>"
    )
    try:
        resp = requests.post(url, data=body, headers=headers, timeout=_SESSION_TIMEOUT)
        resp.raise_for_status()
    except Exception:
        return []

    messages = []
    try:
        root = ET.fromstring(resp.text)
        for msg in root.findall(".//Message"):
            index = msg.findtext("Index") or ""
            phone = msg.findtext("Phone") or ""
            content = msg.findtext("Content") or ""
            date = msg.findtext("Date") or ""
            if phone and content:
                messages.append({"index": index, "phone": phone,
                                  "content": content.strip(), "date": date})
    except ET.ParseError:
        pass
    return messages


def delete_sms(index, gateway=_DEFAULT_GATEWAY):
    """Delete a message from the modem by its index. Returns True on success."""
    try:
        ses, tok = _get_session_token(gateway)
    except Exception:
        return False

    url = _gateway_url(gateway, "/api/sms/delete-sms")
    headers = {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Cookie": ses,
        "__RequestVerificationToken": tok,
    }
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<request><Index>{}</Index></request>".format(index)
    )
    try:
        resp = requests.post(url, data=body, headers=headers, timeout=_SESSION_TIMEOUT)
        resp.raise_for_status()
        root = ET.fromstring(resp.text)
        return (root.text or "").strip().upper() == "OK"
    except Exception:
        return False


# ── Monitoring / telemetry APIs ───────────────────────────────────────────────

# Huawei E3372H-153 ConnectionStatus codes
# Different firmware versions use different base values (0-based vs 900-based)
_CONN_STATUS = {
    # 0-based (some HiLink firmware versions)
    "0":   "disconnected",
    "1":   "connecting",
    "2":   "connected",
    "3":   "disconnected",
    "4":   "disconnecting",
    "5":   "connected",
    # 900-based (most HiLink firmware versions)
    "900": "disconnected",
    "901": "connecting",
    "902": "connected",
    "903": "disconnected",
    "904": "disconnecting",
    "905": "connected",
}

_CONN_CONNECTED = {"connected"}

# /api/monitoring/status NetworkType codes
_NETWORK_TYPE = {
    "0": "No Service", "1": "GSM", "2": "GPRS", "3": "EDGE",
    "4": "WCDMA", "5": "HSDPA", "6": "HSUPA", "7": "HSPA",
    "8": "TD-SCDMA", "9": "HSPA+", "17": "HSPA+ 64QAM",
    "18": "HSPA+ MIMO", "19": "LTE", "41": "LTE+", "101": "LTE",
}


def get_connection_status(gateway=_DEFAULT_GATEWAY):
    """Return connection state from /api/monitoring/status.

    Returns dict with keys: connected, status, network_type, signal_bars.
    """
    try:
        resp = requests.get(
            _gateway_url(gateway, "/api/monitoring/status"), timeout=_SESSION_TIMEOUT
        )
        resp.raise_for_status()
        root = ET.fromstring(resp.text)

        conn_code = (root.findtext("ConnectionStatus") or "").strip()
        net_code = (root.findtext("CurrentNetworkType") or "").strip()
        signal_icon = (root.findtext("SignalIcon") or "").strip()

        status = _CONN_STATUS.get(conn_code, "disconnected" if conn_code else "no_sim")
        connected = status == "connected"

        if net_code:
            network_type = _NETWORK_TYPE.get(net_code, "Unknown ({})".format(net_code))
        else:
            network_type = "No Service" if not connected else "Unknown"

        bars = None
        if signal_icon.isdigit():
            bars = int(signal_icon)

        return {
            "connected": connected,
            "status": status,
            "network_type": network_type,
            "signal_bars": bars,
        }
    except Exception as exc:
        return {"connected": False, "status": "error", "error": str(exc)}


def get_signal_info(gateway=_DEFAULT_GATEWAY):
    """Return RF signal metrics from /api/device/signal.

    Returns dict with keys: rssi, rsrp, rsrq, sinr, band, cell_id.
    Values are integers (dBm / dB) or None when not reported.
    """
    def _int(root, tag):
        val = root.findtext(tag)
        if val is None:
            return None
        val = val.strip()
        try:
            return int(val)
        except (ValueError, TypeError):
            return None

    try:
        resp = requests.get(
            _gateway_url(gateway, "/api/device/signal"), timeout=_SESSION_TIMEOUT
        )
        resp.raise_for_status()
        root = ET.fromstring(resp.text)
        return {
            "rssi":    _int(root, "rssi"),
            "rsrp":    _int(root, "rsrp"),
            "rsrq":    _int(root, "rsrq"),
            "sinr":    _int(root, "sinr"),
            "band":    (root.findtext("band") or "").strip() or None,
            "cell_id": (root.findtext("cell_id") or "").strip() or None,
        }
    except Exception as exc:
        return {"error": str(exc)}


def get_operator_info(gateway=_DEFAULT_GATEWAY):
    """Return operator name and registration state from /api/net/current-plmn."""
    try:
        resp = requests.get(
            _gateway_url(gateway, "/api/net/current-plmn"), timeout=_SESSION_TIMEOUT
        )
        resp.raise_for_status()
        root = ET.fromstring(resp.text)
        full = (root.findtext("FullName") or "").strip()
        short = (root.findtext("ShortName") or "").strip()
        return {
            "operator": full or short,
            "state":    (root.findtext("State") or "").strip(),
        }
    except Exception:
        return {"operator": "", "state": ""}


def get_traffic_stats(gateway=_DEFAULT_GATEWAY):
    """Return cumulative traffic from /api/monitoring/traffic-statistics.

    Returns dict with upload/download byte counts for current session and total.
    """
    def _int(root, tag):
        val = root.findtext(tag)
        if val is None:
            return None
        try:
            return int(val.strip())
        except (ValueError, TypeError):
            return None

    try:
        resp = requests.get(
            _gateway_url(gateway, "/api/monitoring/traffic-statistics"),
            timeout=_SESSION_TIMEOUT,
        )
        resp.raise_for_status()
        root = ET.fromstring(resp.text)
        return {
            "session_upload_bytes":   _int(root, "CurrentUpload"),
            "session_download_bytes": _int(root, "CurrentDownload"),
            "total_upload_bytes":     _int(root, "TotalUpload"),
            "total_download_bytes":   _int(root, "TotalDownload"),
            "session_seconds":        _int(root, "currentConnectTime"),
        }
    except Exception as exc:
        return {"error": str(exc)}


def get_modem_snapshot(gateway=_DEFAULT_GATEWAY):
    """Return a combined telemetry snapshot of the modem.

    Calls all monitoring endpoints and merges results into one dict.
    Always includes 'available' and 'sampled_at'. Designed for the
    modem_monitor watchdog and the local_api /edge/modem endpoint.
    """
    now = datetime.now(timezone.utc).isoformat()

    reachable, reach_err = _modem_reachable(gateway)
    if not reachable:
        return {
            "available": False,
            "connected": False,
            "status": "unreachable",
            "error": reach_err,
            "sampled_at": now,
        }

    conn    = get_connection_status(gateway)
    signal  = get_signal_info(gateway)
    oper    = get_operator_info(gateway)
    traffic = get_traffic_stats(gateway)

    snap = {
        "available":               True,
        "connected":               conn.get("connected", False),
        "status":                  conn.get("status", "unknown"),
        "network_type":            conn.get("network_type", ""),
        "signal_bars":             conn.get("signal_bars"),
        "rssi":                    signal.get("rssi"),
        "rsrp":                    signal.get("rsrp"),
        "rsrq":                    signal.get("rsrq"),
        "sinr":                    signal.get("sinr"),
        "band":                    signal.get("band"),
        "operator":                oper.get("operator", ""),
        "session_upload_bytes":    traffic.get("session_upload_bytes"),
        "session_download_bytes":  traffic.get("session_download_bytes"),
        "total_upload_bytes":      traffic.get("total_upload_bytes"),
        "total_download_bytes":    traffic.get("total_download_bytes"),
        "session_seconds":         traffic.get("session_seconds"),
        "sampled_at":              now,
    }
    # Surface connection-status error so modem_monitor can log it
    if conn.get("error"):
        snap["conn_error"] = conn["error"]
    return snap


def reconnect(gateway=_DEFAULT_GATEWAY):
    """Trigger LTE reconnection via HiLink dial API (Action=1).

    Returns True if the API accepted the request.
    """
    try:
        ses, tok = _get_session_token(gateway)
    except Exception:
        return False

    url = _gateway_url(gateway, "/api/dialup/dial")
    headers = {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Cookie": ses,
        "__RequestVerificationToken": tok,
    }
    body = '<?xml version="1.0" encoding="UTF-8"?><request><Action>1</Action></request>'
    try:
        resp = requests.post(url, data=body, headers=headers, timeout=_SESSION_TIMEOUT)
        resp.raise_for_status()
        root = ET.fromstring(resp.text)
        return (root.text or "").strip().upper() == "OK"
    except Exception:
        return False


# ── CLI diagnostic ────────────────────────────────────────────────────────────

def diagnose(gateway=_DEFAULT_GATEWAY):
    """Print raw modem API responses for debugging.

    Run directly:  python -m mango_node.huawei_api [gateway-ip]
    """
    endpoints = [
        "/api/device/basic_information",
        "/api/monitoring/status",
        "/api/device/signal",
        "/api/net/current-plmn",
        "/api/webserver/SesTokInfo",
    ]
    print("Modem diagnostic — gateway: {}".format(gateway))
    print("=" * 60)
    for path in endpoints:
        url = _gateway_url(gateway, path)
        print("\n[GET] {}".format(url))
        try:
            resp = requests.get(url, timeout=5)
            print("  HTTP {}".format(resp.status_code))
            print("  Body: {}".format(resp.text[:400]))
        except Exception as exc:
            print("  ERROR: {}".format(exc))
    print("\n[SNAPSHOT]")
    import json
    snap = get_modem_snapshot(gateway)
    print(json.dumps(snap, indent=2))


if __name__ == "__main__":
    import sys
    gw = sys.argv[1] if len(sys.argv) > 1 else _DEFAULT_GATEWAY
    diagnose(gw)
