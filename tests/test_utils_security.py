"""Unit tests for app.utils.security."""
from __future__ import annotations

from app.utils.security import hash_password, verify_password


def test_hash_is_not_the_plaintext():
    hashed = hash_password("Correct-Horse-1")
    assert hashed != "Correct-Horse-1"
    assert "Correct-Horse-1" not in hashed


def test_hash_carries_a_werkzeug_method_prefix():
    method = hash_password("x").split("$", 1)[0]
    assert method.startswith(("scrypt:", "pbkdf2:"))


def test_verify_accepts_matching_password():
    assert verify_password("Correct-Horse-1", hash_password("Correct-Horse-1")) is True


def test_verify_rejects_wrong_password():
    assert verify_password("wrong", hash_password("Correct-Horse-1")) is False


def test_verify_is_case_sensitive():
    assert verify_password("correct-horse-1", hash_password("Correct-Horse-1")) is False


def test_hashes_are_salted_and_therefore_unique():
    first = hash_password("same-password")
    second = hash_password("same-password")
    assert first != second
    assert verify_password("same-password", first)
    assert verify_password("same-password", second)


def test_unicode_and_long_passwords_round_trip():
    for password in ("contraseña-ñandú-🌊", "x" * 512):
        assert verify_password(password, hash_password(password)) is True


def test_empty_password_round_trips_and_rejects_others():
    hashed = hash_password("")
    assert verify_password("", hashed) is True
    assert verify_password(" ", hashed) is False
