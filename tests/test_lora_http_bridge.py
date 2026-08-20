"""Unit tests for the pure parsing/normalization helpers of the LoRa->HTTP bridge."""
from __future__ import annotations

from datetime import datetime

import pytest

import lora_http_bridge as bridge


# --------------------------------------------------------------------- env
def test_env_returns_default_when_unset_or_empty(monkeypatch):
    monkeypatch.delenv("MANGO_TEST_VAR", raising=False)
    assert bridge._env("MANGO_TEST_VAR", "fallback") == "fallback"
    monkeypatch.setenv("MANGO_TEST_VAR", "")
    assert bridge._env("MANGO_TEST_VAR", "fallback") == "fallback"
    monkeypatch.setenv("MANGO_TEST_VAR", "value")
    assert bridge._env("MANGO_TEST_VAR", "fallback") == "value"


@pytest.mark.parametrize("raw,expected", [("2.5", 2.5), ("", 1.0), ("abc", 1.0)])
def test_env_float(monkeypatch, raw, expected):
    monkeypatch.setenv("MANGO_TEST_FLOAT", raw)
    assert bridge._env_float("MANGO_TEST_FLOAT", 1.0) == expected


@pytest.mark.parametrize("raw,expected", [("9600", 9600), ("", 5), ("x", 5), ("1.5", 5)])
def test_env_int(monkeypatch, raw, expected):
    monkeypatch.setenv("MANGO_TEST_INT", raw)
    assert bridge._env_int("MANGO_TEST_INT", 5) == expected


def test_now_iso_is_parsable_utc():
    assert datetime.fromisoformat(bridge.now_iso()).utcoffset().total_seconds() == 0


# -------------------------------------------------------------- parse_line
@pytest.mark.parametrize("line", ["", "   ", "\n", "no-separators-here"])
def test_parse_line_returns_none_for_unusable_input(line):
    assert bridge.parse_line(line) is None


def test_parse_line_reads_json_object():
    assert bridge.parse_line('  {"temp": 25.7, "ph": 7.1}  ') == {"temp": 25.7, "ph": 7.1}


def test_parse_line_falls_through_on_malformed_json():
    assert bridge.parse_line("{temp=25.7}") == {"{temp": "25.7}"}


def test_parse_line_reads_key_value_pairs():
    assert bridge.parse_line("temp=25.7, turbidity=12.3 ,") == {
        "temp": "25.7",
        "turbidity": "12.3",
    }


def test_parse_line_ignores_fragments_without_separator():
    assert bridge.parse_line("temp=25.7,garbage") == {"temp": "25.7"}


def test_parse_line_reads_positional_csv_as_temp_and_turbidity():
    assert bridge.parse_line("25.7,12.3,99") == {"temp": "25.7", "turbidity": "12.3"}


def test_parse_line_needs_two_csv_values():
    assert bridge.parse_line("25.7,") is None


# ---------------------------------------------------------- obj_to_readings
def test_obj_to_readings_passes_through_full_payload():
    payload = {
        "readings": [
            {"type": "temp", "value": 25.7},
            {"type": "ph"},
            "not-a-dict",
        ]
    }
    assert bridge.obj_to_readings(payload) == [{"type": "temp", "value": 25.7}]


def test_obj_to_readings_maps_metric_keys():
    assert bridge.obj_to_readings({"temp": 25.7}) == [
        {"type": "temp", "value": 25.7, "unit": None}
    ]


def test_obj_to_readings_supports_nested_value_unit():
    assert bridge.obj_to_readings({"ph": {"value": 7.1, "unit": "pH"}}) == [
        {"type": "ph", "value": 7.1, "unit": "pH"}
    ]


def test_obj_to_readings_skips_envelope_keys():
    obj = {"station": "x", "ts": "now", "source": "bridge", "temp": 25.0}
    assert bridge.obj_to_readings(obj) == [{"type": "temp", "value": 25.0, "unit": None}]


# ------------------------------------------------------- normalize_payload
def test_normalize_payload_shape():
    payload = bridge.normalize_payload("MANGO Station", [{"type": "temp", "value": "25.7", "unit": "C"}])

    assert payload["station"] == {"name": "MANGO Station"}
    assert payload["source"] == "bridge"
    assert payload["readings"] == [{"type": "temp", "value": 25.7, "unit": "C"}]
    datetime.fromisoformat(payload["ts"])


def test_normalize_payload_drops_invalid_readings():
    readings = [
        "not-a-dict",
        {"value": 1.0},                       # missing type
        {"type": "  ", "value": 1.0},         # blank type
        {"type": "ph", "value": "abc"},       # non-numeric value
        {"type": "ph"},                       # missing value
        {"type": " turbidity ", "value": 12},  # kept, type stripped
    ]
    assert bridge.normalize_payload("S", readings)["readings"] == [
        {"type": "turbidity", "value": 12.0, "unit": None}
    ]


def test_normalize_payload_drops_empty_units():
    readings = [
        {"type": "temp", "value": 25.0, "unit": ""},
        {"type": "turbidity", "value": 12.0},
    ]
    units = [r["unit"] for r in bridge.normalize_payload("S", readings)["readings"]]
    assert units == [None, None]


def test_normalize_payload_whitespace_unit_becomes_empty_string():
    # Only None and "" are treated as missing, so "  " is stripped to "".
    readings = [{"type": "ph", "value": 7.0, "unit": "  "}]
    assert bridge.normalize_payload("S", readings)["readings"][0]["unit"] == ""


def test_normalize_payload_allows_empty_readings():
    assert bridge.normalize_payload("S", [])["readings"] == []


# ------------------------------------------------------------ arg parsing
def test_arg_parser_defaults_are_all_false():
    args = bridge.build_arg_parser().parse_args([])
    assert (args.dummy, args.once, args.dry_run) == (False, False, False)


def test_arg_parser_reads_flags():
    args = bridge.build_arg_parser().parse_args(["--dummy", "--once", "--dry-run"])
    assert (args.dummy, args.once, args.dry_run) == (True, True, True)


# ----------------------------------------------------------- http_post_json
def test_http_post_json_returns_true_on_2xx(monkeypatch):
    calls = {}

    class FakeResponse:
        status_code = 204
        text = ""

    def fake_post(url, json, timeout):
        calls.update(url=url, json=json, timeout=timeout)
        return FakeResponse()

    monkeypatch.setitem(
        __import__("sys").modules, "requests", type("M", (), {"post": staticmethod(fake_post)})
    )
    assert bridge.http_post_json("http://api.test/ingest", {"a": 1}, 3.0) is True
    assert calls == {"url": "http://api.test/ingest", "json": {"a": 1}, "timeout": 3.0}


def test_http_post_json_returns_false_on_error_status(monkeypatch):
    class FakeResponse:
        status_code = 500
        text = "boom"

    monkeypatch.setitem(
        __import__("sys").modules,
        "requests",
        type("M", (), {"post": staticmethod(lambda *a, **k: FakeResponse())}),
    )
    assert bridge.http_post_json("http://api.test/ingest", {}, 1.0) is False


def test_http_post_json_returns_false_on_transport_error(monkeypatch):
    def raise_error(*args, **kwargs):
        raise OSError("network down")

    monkeypatch.setitem(
        __import__("sys").modules, "requests", type("M", (), {"post": staticmethod(raise_error)})
    )
    assert bridge.http_post_json("http://api.test/ingest", {}, 1.0) is False
