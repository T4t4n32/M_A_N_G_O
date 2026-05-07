import json
import unittest

from bridge.jetson_serial.motion_bridge import MotionBridge


class FakeSerial:
    def __init__(self):
        self.writes = []
        self.inbox = []

    def write(self, data: bytes):
        self.writes.append(data)

    def readline(self) -> bytes:
        if not self.inbox:
            return b""
        return self.inbox.pop(0)


class MotionBridgeTest(unittest.TestCase):
    def test_ping_and_stop_format(self):
        fake = FakeSerial()
        bridge = MotionBridge(fake)

        seq_ping = bridge.ping()
        seq_stop = bridge.stop(duration_ms=500)

        self.assertEqual(seq_ping, 1)
        self.assertEqual(seq_stop, 2)

        ping_payload = json.loads(fake.writes[0].decode().strip())
        stop_payload = json.loads(fake.writes[1].decode().strip())

        self.assertEqual(ping_payload["cmd"], "PING")
        self.assertEqual(stop_payload["cmd"], "STOP")
        self.assertEqual(stop_payload["duration_ms"], 500)

    def test_read_status(self):
        fake = FakeSerial()
        fake.inbox.append(
            b'{"type":"motion_status","seq_ack":2,"mode":"SAFE","left_pwm":1500,"right_pwm":1500,"vertical_pwm":1500,"error":"NONE"}\n'
        )
        bridge = MotionBridge(fake)
        status = bridge.read_status(timeout_s=0.2)
        self.assertEqual(status["type"], "motion_status")
        self.assertEqual(status["mode"], "SAFE")


if __name__ == "__main__":
    unittest.main()
