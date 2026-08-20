"""Unit tests for the session-based access decorators.

Covers app.middleware.admin_required and app.utils.tier_auth. The database
lookup is replaced so the decorators can be exercised without a live DB.
"""
from __future__ import annotations

import pytest
from flask import Flask

from app.middleware import admin_required as admin_module
from app.utils import tier_auth


class FakeUser:
    def __init__(self, role="estudiante", active=True, user_id=1):
        self.role = role
        self.active = active
        self.id = user_id


@pytest.fixture()
def client():
    app = Flask(__name__)
    app.config.update(TESTING=True, SECRET_KEY="test-secret")

    @app.get("/admin")
    @admin_module.admin_required
    def admin_view():
        return {"ok": "admin"}

    @app.get("/private")
    @admin_module.login_required
    def private_view():
        return {"ok": "private"}

    @app.get("/reports")
    @tier_auth.require_tier("dataline_low")
    def reports_view():
        return {"ok": "reports"}

    return app.test_client()


def set_current_user(monkeypatch, user):
    monkeypatch.setattr(admin_module, "_current_user", lambda: user)
    monkeypatch.setattr(tier_auth, "_current_user", lambda: user)


def set_tier(monkeypatch, tier):
    monkeypatch.setattr(tier_auth, "tier_for_user", lambda user: tier)


@pytest.mark.parametrize("path", ["/admin", "/private", "/reports"])
def test_anonymous_requests_are_unauthorized(client, monkeypatch, path):
    set_current_user(monkeypatch, None)
    assert client.get(path).status_code == 401


@pytest.mark.parametrize("path", ["/admin", "/private", "/reports"])
def test_inactive_users_are_unauthorized(client, monkeypatch, path):
    set_current_user(monkeypatch, FakeUser(role="admin", active=False))
    set_tier(monkeypatch, "institutional")
    assert client.get(path).status_code == 401


def test_admin_required_rejects_non_admin_role(client, monkeypatch):
    set_current_user(monkeypatch, FakeUser(role="estudiante"))

    response = client.get("/admin")
    assert response.status_code == 403
    assert "admin" in response.get_json()["error"]


def test_admin_required_allows_admin_role(client, monkeypatch):
    set_current_user(monkeypatch, FakeUser(role="admin"))
    assert client.get("/admin").get_json() == {"ok": "admin"}


def test_login_required_allows_any_active_role(client, monkeypatch):
    set_current_user(monkeypatch, FakeUser(role="estudiante"))
    assert client.get("/private").get_json() == {"ok": "private"}


@pytest.mark.parametrize("tier", ["dataline_low", "dataline_high", "institutional", "admin"])
def test_require_tier_allows_equal_or_higher_tiers(client, monkeypatch, tier):
    set_current_user(monkeypatch, FakeUser())
    set_tier(monkeypatch, tier)
    assert client.get("/reports").get_json() == {"ok": "reports"}


@pytest.mark.parametrize("tier", ["none", "registrado_basico", "documental_premium", "unknown"])
def test_require_tier_rejects_lower_tiers(client, monkeypatch, tier):
    set_current_user(monkeypatch, FakeUser())
    set_tier(monkeypatch, tier)

    response = client.get("/reports")
    assert response.status_code == 403
    body = response.get_json()
    assert body["error"] == "forbidden"
    assert body["required_tier"] == "dataline_low"
    assert body["your_tier"] == tier


def test_decorators_preserve_view_names():
    def view():
        return "x"

    assert admin_module.admin_required(view).__name__ == "view"
    assert admin_module.login_required(view).__name__ == "view"
    assert tier_auth.require_tier("dataline_low")(view).__name__ == "view"
