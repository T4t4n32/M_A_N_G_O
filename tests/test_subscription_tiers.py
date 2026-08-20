"""Unit tests for the tier logic in app.models.subscription."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from app.models import subscription as sub_module
from app.models.subscription import (
    MONTHLY_DAYS,
    QUARTERLY_DAYS,
    TIER_LABELS,
    TIER_ORDER,
    VALID_TIERS,
    UserSubscription,
    default_expires_at,
    has_min_tier,
    tier_for_user,
)


class FakeUser:
    def __init__(self, role="estudiante", user_id=1):
        self.role = role
        self.id = user_id


def make_subscription(**kwargs):
    sub = UserSubscription()
    sub.user_id = kwargs.get("user_id", 1)
    sub.tier = kwargs.get("tier", "dataline_low")
    sub.granted_at = kwargs.get("granted_at", datetime.now(timezone.utc))
    sub.expires_at = kwargs.get("expires_at")
    sub.revoked_at = kwargs.get("revoked_at")
    sub.notes = kwargs.get("notes")
    return sub


def test_tier_order_is_strictly_increasing():
    ordered = ["none", *VALID_TIERS, "admin"]
    values = [TIER_ORDER[t] for t in ordered]
    assert values == sorted(values)
    assert len(set(values)) == len(values)


def test_every_known_tier_has_a_label():
    assert set(TIER_ORDER) == set(TIER_LABELS)


def test_is_active_for_subscription_without_expiry():
    assert make_subscription().is_active() is True


def test_is_active_false_when_revoked():
    revoked = make_subscription(revoked_at=datetime.now(timezone.utc))
    assert revoked.is_active() is False


def test_is_active_false_when_expired():
    expired = make_subscription(
        expires_at=datetime.now(timezone.utc) - timedelta(seconds=1)
    )
    assert expired.is_active() is False


def test_is_active_true_before_expiry():
    future = make_subscription(expires_at=datetime.now(timezone.utc) + timedelta(days=1))
    assert future.is_active() is True


def test_to_dict_serializes_timestamps_and_active_flag():
    granted = datetime(2026, 1, 1, tzinfo=timezone.utc)
    expires = datetime(2026, 4, 1, tzinfo=timezone.utc)
    sub = make_subscription(granted_at=granted, expires_at=expires, notes="pilot")

    data = sub.to_dict()
    assert data["granted_at"] == granted.isoformat()
    assert data["expires_at"] == expires.isoformat()
    assert data["tier"] == "dataline_low"
    assert data["notes"] == "pilot"
    assert data["revoked_at"] is None
    assert data["active"] is False  # expiry already in the past


def test_to_dict_handles_missing_timestamps():
    sub = make_subscription(granted_at=None)
    data = sub.to_dict()
    assert data["granted_at"] is None
    assert data["expires_at"] is None


@pytest.mark.parametrize("tier,expected_days", [
    ("registrado_basico", MONTHLY_DAYS),
    ("documental_premium", QUARTERLY_DAYS),
    ("dataline_low", QUARTERLY_DAYS),
    ("dataline_high", QUARTERLY_DAYS),
])
def test_default_expires_at_uses_tier_duration(tier, expected_days):
    expires = default_expires_at(tier)
    delta = expires - datetime.now(timezone.utc)
    assert abs(delta - timedelta(days=expected_days)) < timedelta(minutes=1)


@pytest.mark.parametrize("tier", ["institutional", "admin", "unknown"])
def test_default_expires_at_is_none_for_non_expiring_tiers(tier):
    assert default_expires_at(tier) is None


def test_tier_for_user_returns_admin_for_admin_role():
    assert tier_for_user(FakeUser(role="admin")) == "admin"


def test_tier_for_user_returns_active_subscription_tier(monkeypatch):
    monkeypatch.setattr(
        UserSubscription,
        "active_for_user",
        classmethod(lambda cls, user_id: make_subscription(tier="dataline_high")),
    )
    assert tier_for_user(FakeUser()) == "dataline_high"


def test_tier_for_user_returns_none_without_subscription(monkeypatch):
    monkeypatch.setattr(
        UserSubscription,
        "active_for_user",
        classmethod(lambda cls, user_id: None),
    )
    assert tier_for_user(FakeUser()) == "none"


@pytest.mark.parametrize("effective,minimum,expected", [
    ("dataline_low", "dataline_low", True),
    ("dataline_high", "dataline_low", True),
    ("registrado_basico", "dataline_low", False),
    ("none", "registrado_basico", False),
    ("admin", "institutional", True),
    ("institutional", "unknown_tier", True),
])
def test_has_min_tier(monkeypatch, effective, minimum, expected):
    monkeypatch.setattr(sub_module, "tier_for_user", lambda user: effective)
    assert has_min_tier(FakeUser(), minimum) is expected
