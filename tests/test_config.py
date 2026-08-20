"""Unit tests for app.config.

Config reads the environment at import time, so env-dependent assertions
reload the module inside a patched environment.
"""
from __future__ import annotations

import importlib

import pytest

import app.config as config_module


def reload_config(monkeypatch, **env):
    for key, value in env.items():
        if value is None:
            monkeypatch.delenv(key, raising=False)
        else:
            monkeypatch.setenv(key, value)
    return importlib.reload(config_module)


@pytest.fixture(autouse=True)
def restore_config_module():
    yield
    importlib.reload(config_module)


@pytest.mark.parametrize("value", ["1", "true", "TRUE", "True", "yes", "YES"])
def test_truthy_accepts_affirmative_values(value):
    assert config_module._truthy(value) is True


@pytest.mark.parametrize("value", ["0", "false", "no", "", "off", "2"])
def test_truthy_rejects_other_values(value):
    assert config_module._truthy(value) is False


def test_defaults_are_applied_when_env_is_absent(monkeypatch):
    module = reload_config(
        monkeypatch,
        DATABASE_URL=None,
        REDIS_URL=None,
        SECRET_KEY=None,
        DB_POOL_SIZE=None,
        SESSION_SECURE=None,
        CORS_ORIGINS=None,
        UPLOAD_FOLDER=None,
    )

    assert module.Config.SQLALCHEMY_DATABASE_URI == ""
    assert module.Config.REDIS_URL == "redis://redis:6379/0"
    assert module.Config.SECRET_KEY == "change-me"
    assert module.Config.SQLALCHEMY_POOL_SIZE == 10
    assert module.Config.SESSION_COOKIE_SECURE is False
    assert module.Config.UPLOAD_FOLDER == "/app/uploads"
    assert "https://integramosoe.com" in module.Config.CORS_ORIGINS


def test_environment_overrides_are_honoured(monkeypatch):
    module = reload_config(
        monkeypatch,
        DATABASE_URL="postgresql+psycopg2://u:p@db:5432/mango",
        REDIS_URL="redis://cache:6379/2",
        SECRET_KEY="s3cret",
        DB_POOL_SIZE="7",
        DB_MAX_OVERFLOW="11",
        DB_POOL_TIMEOUT="13",
        DB_POOL_RECYCLE="900",
        SESSION_SECURE="1",
    )

    assert module.Config.SQLALCHEMY_DATABASE_URI == "postgresql+psycopg2://u:p@db:5432/mango"
    assert module.Config.REDIS_URL == "redis://cache:6379/2"
    assert module.Config.SECRET_KEY == "s3cret"
    assert module.Config.SQLALCHEMY_POOL_SIZE == 7
    assert module.Config.SQLALCHEMY_MAX_OVERFLOW == 11
    assert module.Config.SQLALCHEMY_POOL_TIMEOUT == 13
    assert module.Config.SQLALCHEMY_POOL_RECYCLE == 900
    assert module.Config.SESSION_COOKIE_SECURE is True


def test_cors_origins_are_split_and_stripped(monkeypatch):
    module = reload_config(
        monkeypatch,
        CORS_ORIGINS=" https://a.test , https://b.test ,, ",
    )
    assert module.Config.CORS_ORIGINS == ["https://a.test", "https://b.test"]


def test_upload_limits_are_converted_from_megabytes(monkeypatch):
    module = reload_config(
        monkeypatch,
        MAX_UPLOAD_IMAGE_MB="10",
        MAX_UPLOAD_VIDEO_MB="100",
        MAX_UPLOAD_DOC_MB="5",
    )

    assert module.Config.MAX_UPLOAD_IMAGE_BYTES == 10 * 1024 * 1024
    assert module.Config.MAX_UPLOAD_VIDEO_BYTES == 100 * 1024 * 1024
    assert module.Config.MAX_UPLOAD_DOC_BYTES == 5 * 1024 * 1024
    # Request body cap must not be smaller than the largest per-kind limit.
    assert module.Config.MAX_CONTENT_LENGTH >= module.Config.MAX_UPLOAD_VIDEO_BYTES


def test_session_and_pool_hardening_defaults():
    assert config_module.Config.SESSION_COOKIE_HTTPONLY is True
    assert config_module.Config.SESSION_COOKIE_SAMESITE == "Lax"
    assert config_module.Config.SQLALCHEMY_POOL_PRE_PING is True
    assert config_module.Config.SQLALCHEMY_TRACK_MODIFICATIONS is False
    assert config_module.Config.PERMANENT_SESSION_LIFETIME.days == 7
