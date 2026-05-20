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
