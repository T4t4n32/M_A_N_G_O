"""Regression tests for error propagation.

Each test covers a path that previously swallowed a failure and answered as
if nothing had gone wrong.
"""

import pytest
from sqlalchemy.exc import OperationalError


def test_unhandled_exception_returns_json_500_and_logs(app, client, caplog):
    @app.route("/__test__/boom")
    def boom():
        raise RuntimeError("kaboom")

    with caplog.at_level("ERROR", logger="mango.app"):
        resp = client.get("/__test__/boom")

    assert resp.status_code == 500
    assert resp.get_json()["error"] == "internal_server_error"
    assert "kaboom" in caplog.text


def test_http_exception_keeps_status_and_json_shape(client):
    resp = client.get("/api/v1/definitely-not-a-route")
    assert resp.status_code == 404
    assert resp.get_json()["error"] == "not_found"


def test_readings_latest_reports_503_when_schema_unreadable(monkeypatch, logged_in_client):
    from app.routes import readings

    def explode():
        raise readings.DatabaseUnavailable("connection refused")

    monkeypatch.setattr(readings, "_get_readings_table", explode)
    resp = logged_in_client.get("/api/v1/readings/latest")

    assert resp.status_code == 503
    assert resp.get_json()["error"] == "database_unavailable"


def test_readings_export_fails_loudly_instead_of_empty_csv(monkeypatch, logged_in_client):
    from app.extensions import db
    from app.routes import readings

    monkeypatch.setattr(readings, "_get_readings_table", lambda: "mango_compat_readings")

    def failing_execute(*args, **kwargs):
        raise OperationalError("SELECT 1", {}, Exception("connection lost"))

    monkeypatch.setattr(db.session, "execute", failing_execute)
    resp = logged_in_client.get("/api/v1/readings/export?type=ph")

    assert resp.status_code == 500
    assert resp.get_json()["error"] == "query_failed"


@pytest.mark.parametrize("url", [
    "/api/v1/readings/history?type=ph&minutes=abc",
    "/api/v1/readings/export?type=ph&hours=abc",
])
def test_invalid_numeric_params_are_rejected(logged_in_client, url):
    resp = logged_in_client.get(url)
    assert resp.status_code == 400


def test_ingest_returns_503_when_commit_fails(monkeypatch, client):
    from app.extensions import db

    def failing_commit():
        raise OperationalError("INSERT", {}, Exception("disk full"))

    monkeypatch.setattr(db.session, "commit", failing_commit)

    resp = client.post("/api/v1/ingest", json={
        "station": {"name": "Test Station"},
        "packet_id": "test-commit-failure",
        "readings": [{"type": "ph", "value": 7.1, "unit": "pH"}],
    })

    assert resp.status_code == 503
    assert resp.get_json()["error"] == "ingest_failed"


def test_ingest_latest_rejects_invalid_limit(client):
    resp = client.get("/api/v1/latest?limit=abc")
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "invalid_limit"
