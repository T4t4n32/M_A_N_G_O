"""Alert rules, contacts, and event log endpoints.

Admin routes (require session role=admin):
  GET  /api/v1/alerts/rules             list rules
  POST /api/v1/alerts/rules             create rule
  PUT  /api/v1/alerts/rules/<id>        update rule
  DELETE /api/v1/alerts/rules/<id>      delete rule

  GET  /api/v1/alerts/contacts          list contacts
  POST /api/v1/alerts/contacts          create contact
  PUT  /api/v1/alerts/contacts/<id>     update contact
  DELETE /api/v1/alerts/contacts/<id>   delete contact

  GET  /api/v1/alerts/history           paginated event log

Edge routes (require INGEST_API_KEY via X-Api-Key header):
  GET  /api/v1/alerts/config            rules + contacts for SMS dispatch
  POST /api/v1/alerts/events            log an SMS event from the edge
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from sqlalchemy import desc, text

from app.auth_ingest import require_ingest_key
from app.extensions import db
from app.middleware.admin_required import admin_required, login_required
from app.models.alert import (
    ALERT_COMPARISONS,
    ALERT_LEVELS,
    ALERT_SENSOR_TYPES,
    AlertContact,
    AlertEvent,
    AlertRule,
)

log = logging.getLogger("mango.alerts")

alerts_bp = Blueprint("alerts", __name__, url_prefix="/api/v1/alerts")

_TABLES_READY = False


def _ensure_tables() -> None:
    global _TABLES_READY
    if _TABLES_READY:
        return
    db.create_all()
    _TABLES_READY = True


# ---------------------------------------------------------------------------
# Alert Rules — admin only
# ---------------------------------------------------------------------------

@alerts_bp.get("/rules")
@admin_required
def list_rules():
    _ensure_tables()
    rules = AlertRule.query.order_by(AlertRule.sensor_type, AlertRule.threshold).all()
    return jsonify([r.to_dict() for r in rules]), 200


@alerts_bp.post("/rules")
@admin_required
def create_rule():
    _ensure_tables()
    body = request.get_json(force=True, silent=True) or {}

    sensor_type = str(body.get("sensor_type", "")).strip()
    comparison = str(body.get("comparison", "")).strip()
    level = str(body.get("level", "")).strip()

    if sensor_type not in ALERT_SENSOR_TYPES:
        return jsonify({"error": f"sensor_type must be one of {ALERT_SENSOR_TYPES}"}), 400
    if comparison not in ALERT_COMPARISONS:
        return jsonify({"error": f"comparison must be one of {ALERT_COMPARISONS}"}), 400
    if level not in ALERT_LEVELS:
        return jsonify({"error": f"level must be one of {ALERT_LEVELS}"}), 400

    try:
        threshold = float(body["threshold"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "threshold must be a number"}), 400

    rule = AlertRule(
        sensor_type=sensor_type,
        comparison=comparison,
        threshold=threshold,
        level=level,
        enabled=bool(body.get("enabled", True)),
    )
    db.session.add(rule)
    db.session.commit()
    return jsonify(rule.to_dict()), 201


@alerts_bp.put("/rules/<int:rule_id>")
@admin_required
def update_rule(rule_id: int):
    _ensure_tables()
    rule = db.session.get(AlertRule, rule_id)
    if not rule:
        return jsonify({"error": "not found"}), 404

    body = request.get_json(force=True, silent=True) or {}

    if "sensor_type" in body:
        if body["sensor_type"] not in ALERT_SENSOR_TYPES:
            return jsonify({"error": f"sensor_type must be one of {ALERT_SENSOR_TYPES}"}), 400
        rule.sensor_type = body["sensor_type"]

    if "comparison" in body:
        if body["comparison"] not in ALERT_COMPARISONS:
            return jsonify({"error": f"comparison must be one of {ALERT_COMPARISONS}"}), 400
        rule.comparison = body["comparison"]

    if "level" in body:
        if body["level"] not in ALERT_LEVELS:
            return jsonify({"error": f"level must be one of {ALERT_LEVELS}"}), 400
        rule.level = body["level"]

    if "threshold" in body:
        try:
            rule.threshold = float(body["threshold"])
        except (TypeError, ValueError):
            return jsonify({"error": "threshold must be a number"}), 400

    if "enabled" in body:
        rule.enabled = bool(body["enabled"])

    rule.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(rule.to_dict()), 200


@alerts_bp.delete("/rules/<int:rule_id>")
@admin_required
def delete_rule(rule_id: int):
    _ensure_tables()
    rule = db.session.get(AlertRule, rule_id)
    if not rule:
        return jsonify({"error": "not found"}), 404
    db.session.delete(rule)
    db.session.commit()
    return jsonify({"ok": True}), 200


# ---------------------------------------------------------------------------
# Alert Contacts — admin only
# ---------------------------------------------------------------------------

@alerts_bp.get("/contacts")
@admin_required
def list_contacts():
    _ensure_tables()
    contacts = AlertContact.query.order_by(AlertContact.name).all()
    return jsonify([c.to_dict() for c in contacts]), 200


@alerts_bp.post("/contacts")
@admin_required
def create_contact():
    _ensure_tables()
    body = request.get_json(force=True, silent=True) or {}

    name = str(body.get("name", "")).strip()
    phone = str(body.get("phone", "")).strip()

    if not name:
        return jsonify({"error": "name is required"}), 400
    if not phone:
        return jsonify({"error": "phone is required"}), 400
    if not phone.startswith("+") or not phone[1:].isdigit():
        return jsonify({"error": "phone must be in E.164 format, e.g. +573001234567"}), 400

    contact = AlertContact(
        name=name,
        phone=phone,
        active=bool(body.get("active", True)),
    )
    db.session.add(contact)
    db.session.commit()
    return jsonify(contact.to_dict()), 201


@alerts_bp.put("/contacts/<int:contact_id>")
@admin_required
def update_contact(contact_id: int):
    _ensure_tables()
    contact = db.session.get(AlertContact, contact_id)
    if not contact:
        return jsonify({"error": "not found"}), 404

    body = request.get_json(force=True, silent=True) or {}

    if "name" in body:
        name = str(body["name"]).strip()
        if not name:
            return jsonify({"error": "name cannot be empty"}), 400
        contact.name = name

    if "phone" in body:
        phone = str(body["phone"]).strip()
        if not phone.startswith("+") or not phone[1:].isdigit():
            return jsonify({"error": "phone must be in E.164 format"}), 400
        contact.phone = phone

    if "active" in body:
        contact.active = bool(body["active"])

    db.session.commit()
    return jsonify(contact.to_dict()), 200


@alerts_bp.delete("/contacts/<int:contact_id>")
@admin_required
def delete_contact(contact_id: int):
    _ensure_tables()
    contact = db.session.get(AlertContact, contact_id)
    if not contact:
        return jsonify({"error": "not found"}), 404
    db.session.delete(contact)
    db.session.commit()
    return jsonify({"ok": True}), 200


# ---------------------------------------------------------------------------
# Alert History — admin only
# ---------------------------------------------------------------------------

@alerts_bp.get("/history")
@admin_required
def alert_history():
    _ensure_tables()
    try:
        limit = max(1, min(500, int(request.args.get("limit", 100))))
        offset = max(0, int(request.args.get("offset", 0)))
    except (TypeError, ValueError):
        limit, offset = 100, 0

    events = (
        AlertEvent.query
        .order_by(desc(AlertEvent.created_at))
        .limit(limit)
        .offset(offset)
        .all()
    )
    total = AlertEvent.query.count()
    return jsonify({"total": total, "events": [e.to_dict() for e in events]}), 200


# ---------------------------------------------------------------------------
# Edge endpoints — authenticated with INGEST_API_KEY
# ---------------------------------------------------------------------------

@alerts_bp.get("/config")
@require_ingest_key
def alert_config():
    """Return active rules and contacts for the edge SMS dispatcher."""
    _ensure_tables()
    rules = AlertRule.query.filter_by(enabled=True).all()
    contacts = AlertContact.query.filter_by(active=True).all()
    return jsonify({
        "rules": [r.to_dict() for r in rules],
        "contacts": [c.to_dict() for c in contacts],
    }), 200


@alerts_bp.get("/status")
@login_required
def alert_status():
    """Dashboard status: last SMS, recent events, maintenance alerts, stats.

    Available to any authenticated user (not admin-only).
    """
    _ensure_tables()
    now = _utcnow = datetime.now(timezone.utc)

    # Last SMS successfully sent
    last_event = (
        AlertEvent.query
        .filter_by(sms_sent=True)
        .order_by(desc(AlertEvent.sms_sent_at))
        .first()
    )

    # Recent events (last 10, regardless of sms_sent status)
    recent = (
        AlertEvent.query
        .order_by(desc(AlertEvent.created_at))
        .limit(10)
        .all()
    )

    # Stats
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    sent_today = AlertEvent.query.filter(
        AlertEvent.sms_sent == True,  # noqa: E712
        AlertEvent.sms_sent_at >= today_start,
    ).count()
    sent_24h = AlertEvent.query.filter(
        AlertEvent.sms_sent == True,  # noqa: E712
        AlertEvent.sms_sent_at >= now - timedelta(hours=24),
    ).count()
    active_rules = AlertRule.query.filter_by(enabled=True).count()
    active_contacts = AlertContact.query.filter_by(active=True).count()

    # Maintenance alerts (generated from readings data)
    maintenance = []
    try:
        row = db.session.execute(
            text("SELECT MAX(ts) AS last_ts, MIN(ts) AS first_ts FROM mango_compat_readings")
        ).fetchone()

        if row and row.last_ts:
            def _parse_ts(raw):
                s = str(raw).replace(" ", "T")
                dt = datetime.fromisoformat(s)
                return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

            last_ts = _parse_ts(row.last_ts)
            first_ts = _parse_ts(row.first_ts)
            age_min = (now - last_ts).total_seconds() / 60
            station_days = (now - first_ts).days

            if age_min > 360:
                maintenance.append({
                    "type": "station_offline",
                    "level": "critical",
                    "message": f"Sin datos de la estación hace {int(age_min / 60)} h — Verificar conectividad LTE y serial",
                })
            elif age_min > 60:
                maintenance.append({
                    "type": "no_data",
                    "level": "warning",
                    "message": f"Sin datos en los últimos {int(age_min)} min — Verificar conexión serial con el ESP32",
                })

            if station_days >= 30 and station_days % 30 < 2:
                maintenance.append({
                    "type": "calibration_due",
                    "level": "warning",
                    "message": f"Calibración de sensores recomendada — La estación lleva {station_days} días en operación",
                })
        else:
            maintenance.append({
                "type": "no_data",
                "level": "warning",
                "message": "No se han recibido lecturas — Verificar que el nodo Jetson esté operativo",
            })
    except Exception:
        db.session.rollback()
        log.error("Alert status: readings window query failed — maintenance alerts omitted",
                  exc_info=True)
        maintenance.append({
            "type": "status_unavailable",
            "level": "warning",
            "message": "No se pudo evaluar el estado de las lecturas — revisar la base de datos",
        })

    if active_contacts == 0:
        maintenance.append({
            "type": "no_contacts",
            "level": "warning",
            "message": "Sin contactos configurados — Agrega un número en el panel de administración para recibir alertas SMS",
        })
    if active_rules == 0:
        maintenance.append({
            "type": "no_rules",
            "level": "warning",
            "message": "Sin reglas de alerta definidas — Define umbrales en el panel de administración",
        })

    return jsonify({
        "last_sms": last_event.to_dict() if last_event else None,
        "recent_events": [e.to_dict() for e in recent],
        "stats": {
            "sent_today": sent_today,
            "sent_last_24h": sent_24h,
            "active_rules": active_rules,
            "active_contacts": active_contacts,
        },
        "maintenance_alerts": maintenance,
    }), 200


@alerts_bp.post("/events")
@require_ingest_key
def log_alert_event():
    """Log an SMS alert event reported by the edge node."""
    _ensure_tables()
    body = request.get_json(force=True, silent=True) or {}

    sensor_type = str(body.get("sensor_type", "")).strip()
    alert_level = str(body.get("alert_level", "")).strip()

    if not sensor_type or not alert_level:
        return jsonify({"error": "sensor_type and alert_level are required"}), 400

    measured_at = None
    raw_ts = body.get("measured_at")
    if raw_ts:
        try:
            measured_at = datetime.fromisoformat(str(raw_ts).replace("Z", "+00:00"))
        except ValueError:
            log.warning("Alert event: unparseable measured_at %r — stored as null", raw_ts)

    sms_sent_at = None
    raw_sms_ts = body.get("sms_sent_at")
    if raw_sms_ts:
        try:
            sms_sent_at = datetime.fromisoformat(str(raw_sms_ts).replace("Z", "+00:00"))
        except ValueError:
            log.warning("Alert event: unparseable sms_sent_at %r — stored as null", raw_sms_ts)

    try:
        value = float(body["value"]) if body.get("value") is not None else None
    except (TypeError, ValueError):
        log.warning("Alert event: non-numeric value %r — stored as null", body.get("value"))
        value = None

    event = AlertEvent(
        station_name=str(body.get("station_name", ""))[:120] or None,
        sensor_type=sensor_type[:32],
        value=value,
        alert_level=alert_level[:16],
        rule_id=body.get("rule_id"),
        contact_id=body.get("contact_id"),
        message=str(body.get("message", ""))[:1000] or None,
        sms_sent=bool(body.get("sms_sent", False)),
        sms_sent_at=sms_sent_at,
        sms_error=str(body.get("sms_error", ""))[:500] or None,
        measured_at=measured_at,
    )
    db.session.add(event)
    db.session.commit()
    return jsonify({"ok": True, "id": event.id}), 201
