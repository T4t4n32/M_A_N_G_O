"""HTTP client for the Huawei E3372H-153 HiLink modem web API.

The E3372H in HiLink mode exposes a REST-like API at its default
gateway (192.168.8.1).  Authentication uses a session cookie and a
CSRF token obtained from /api/webserver/SesTokInfo.

SMS sending requires:
  1. GET /api/webserver/SesTokInfo → SessionID cookie + TokInfo header
  2. POST /api/sms/send-sms with XML body and both auth values

References:
  Huawei HiLink API — well-documented community reverse engineering.
  The E3372H firmware version that ships with the -153 variant
  supports both the legacy and v2 token APIs; this module uses the
  legacy form for maximum compatibility.
"""

from __future__ import annotations

import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Optional

import requests

_DEFAULT_GATEWAY = "192.168.8.1"
_SESSION_TIMEOUT = 10  # seconds


def _gateway_url(gateway: str, path: str) -> str:
    return f"http://{gateway}{path}"


def _get_session_token(gateway: str) -> tuple[str, str]:
    """Return (SessionID, TokInfo) from the modem.

    Raises requests.RequestException on network failure.
    Raises ValueError if the response XML is malformed.
    """
    url = _gateway_url(gateway, "/api/webserver/SesTokInfo")
    resp = requests.get(url, timeout=_SESSION_TIMEOUT)
    resp.raise_for_status()

    root = ET.fromstring(resp.text)
    ses = root.findtext("SesInfo") or ""
    tok = root.findtext("TokInfo") or ""
    if not ses or not tok:
        raise ValueError(f"unexpected SesTokInfo response: {resp.text[:200]}")
    return ses, tok


def _build_sms_xml(phone: str, message: str) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    length = len(message)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<request>"
        "<Index>-1</Index>"
        f"<Phones><Phone>{phone}</Phone></Phones>"
        "<Sca></Sca>"
        f"<Content>{message}</Content>"
        f"<Length>{length}</Length>"
        "<Reserved>1</Reserved>"
        f"<Date>{now}</Date>"
        "</request>"
    )


def send_sms(phone: str, message: str, gateway: str = _DEFAULT_GATEWAY) -> tuple[bool, Optional[str]]:
    """Send an SMS via the Huawei HiLink API.

    Returns (success, error_message).  error_message is None on success.

    Parameters
    ----------
    phone:
        Destination number in E.164 format, e.g. "+573001234567".
    message:
        SMS text, max 160 characters for single SMS.
    gateway:
        IP address of the Huawei modem. Default: 192.168.8.1.
    """
    try:
        ses, tok = _get_session_token(gateway)
    except Exception as exc:
        return False, f"token fetch failed: {exc}"

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
        return False, f"send request failed: {exc}"

    # The modem returns <response>OK</response> on success.
    try:
        root = ET.fromstring(resp.text)
        if root.text and root.text.strip().upper() == "OK":
            return True, None
        # Some firmware returns <error><code>...</code></error>
        err_code = root.findtext("code") or root.text or resp.text[:100]
        return False, f"modem error: {err_code}"
    except ET.ParseError:
        return False, f"unparseable modem response: {resp.text[:100]}"


def modem_available(gateway: str = _DEFAULT_GATEWAY) -> bool:
    """Return True if the modem web API is reachable."""
    try:
        requests.get(_gateway_url(gateway, "/api/device/basic_information"), timeout=3)
        return True
    except Exception:
        return False


def get_inbox(gateway: str = _DEFAULT_GATEWAY) -> list[dict]:
    """Return received SMS messages from the modem inbox.

    Each item has keys: index (str), phone (str), content (str), date (str).
    Returns an empty list on any error.
    """
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
        "<BoxType>1</BoxType>"   # 1 = inbox
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
                messages.append({"index": index, "phone": phone, "content": content.strip(), "date": date})
    except ET.ParseError:
        pass
    return messages


def delete_sms(index: str, gateway: str = _DEFAULT_GATEWAY) -> bool:
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
        f"<request><Index>{index}</Index></request>"
    )
    try:
        resp = requests.post(url, data=body, headers=headers, timeout=_SESSION_TIMEOUT)
        resp.raise_for_status()
        root = ET.fromstring(resp.text)
        return (root.text or "").strip().upper() == "OK"
    except Exception:
        return False
