#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
mango_serial.py — Cliente Python para el subcerebro de movimiento ESP32.

Implementa:
- Detección automática de puerto (CP210x VID 0x10C4, CH340 VID 0x1A86, FT232 VID 0x0403,
  USB-CDC nativo del ESP32-S3 0x303A).
- Lectura asíncrona en thread de fondo.
- API pública: ping(), stop(), status(), set_mode(mode).
- Reconexión automática ante SerialException.

Compatible con Python >= 3.4 (Jetson TK1 / Ubuntu 14.04) y con Python 3.6+.
Requiere pyserial == 3.5.

Documentación de referencia:
- pyserial Short intro: https://pyserial.readthedocs.io/en/latest/shortintro.html
- list_ports: https://pyserial.readthedocs.io/en/stable/tools.html
- NDJSON spec: https://github.com/ndjson/ndjson-spec
"""

import json
import logging
import threading
import time
from queue import Queue, Empty

import serial
import serial.tools.list_ports

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
DEFAULT_BAUD = 115200
DEFAULT_TIMEOUT_S = 0.2     # readline timeout para no bloquear el thread reader
RESPONSE_TIMEOUT_S = 1.0    # cuánto esperar un motion_status tras enviar un cmd
RECONNECT_DELAY_S = 1.0
MAX_LINE_BYTES = 512        # margen sobre los 256 B del protocolo

# VID conocidos de chips USB-serial usados en placas ESP32.
# (Espressif ESP32-S3 nativo: 0x303A.)
KNOWN_USB_VIDS = {
    0x10C4,   # Silicon Labs CP210x
    0x1A86,   # WCH CH340 / CH341
    0x0403,   # FTDI FT232
    0x303A,   # Espressif (ESP32-S3 USB-JTAG nativo)
    0x067B,   # Prolific (PL2303)
}

# ---------------------------------------------------------------------------
# Logger
# ---------------------------------------------------------------------------
logger = logging.getLogger("mango.serial")
if not logger.handlers:
    _h = logging.StreamHandler()
    _h.setFormatter(logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    ))
    logger.addHandler(_h)
    logger.setLevel(logging.INFO)


# ---------------------------------------------------------------------------
# Detección de puerto
# ---------------------------------------------------------------------------
def autodetect_port():
    """Devuelve la ruta del primer puerto que parezca un ESP32, o None."""
    candidates = list(serial.tools.list_ports.comports())
    # 1) Por VID conocido
    for p in candidates:
        if p.vid is not None and p.vid in KNOWN_USB_VIDS:
            logger.info("Auto-detect: ESP32 detectado en %s (vid=0x%04X pid=0x%04X desc=%r)",
                        p.device, p.vid, p.pid or 0, p.description)
            return p.device
    # 2) Fallback heurístico por nombre de dispositivo
    for p in candidates:
        if any(p.device.startswith(prefix) for prefix in
               ("/dev/ttyUSB", "/dev/ttyACM")):
            logger.info("Auto-detect (fallback): %s (desc=%r)", p.device, p.description)
            return p.device
    return None


# ---------------------------------------------------------------------------
# Cliente
# ---------------------------------------------------------------------------
class MangoSerialClient:
    """Cliente de alto nivel para hablar con el ESP32 de movimiento."""

    def __init__(self, port=None, baud=DEFAULT_BAUD, auto_reconnect=True):
        self._port_arg = port
        self._baud = baud
        self._auto_reconnect = auto_reconnect

        self._ser = None
        self._reader_thread = None
        self._stop_event = threading.Event()
        self._rx_queue = Queue()           # cola de motion_status recibidos
        self._seq = 0
        self._seq_lock = threading.Lock()

    # -------------------------------------------------------------- lifecycle
    def connect(self):
        port = self._port_arg or autodetect_port()
        if port is None:
            raise RuntimeError(
                "No se encontró ningún puerto ESP32. Conéctalo o pasa port=... explícito."
            )
        logger.info("Abriendo %s @ %d baud", port, self._baud)
        self._ser = serial.Serial(
            port=port,
            baudrate=self._baud,
            bytesize=serial.EIGHTBITS,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE,
            timeout=DEFAULT_TIMEOUT_S,
            xonxoff=False,
            rtscts=False,
            dsrdtr=False,
        )
        # Algunas placas se resetean al abrir el puerto (DTR toggling).
        time.sleep(2.0)
        try:
            self._ser.reset_input_buffer()
        except Exception:
            pass

        self._stop_event.clear()
        self._reader_thread = threading.Thread(
            target=self._reader_loop, name="mango-serial-reader", daemon=True
        )
        self._reader_thread.start()
        logger.info("Conectado y reader thread iniciado")

    def close(self):
        self._stop_event.set()
        if self._reader_thread is not None:
            self._reader_thread.join(timeout=2.0)
        if self._ser is not None:
            try:
                self._ser.close()
            except Exception:
                pass
        self._ser = None
        logger.info("Conexión cerrada")

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc, tb):
        self.close()

    # -------------------------------------------------------------- reader
    def _reader_loop(self):
        buf = bytearray()
        while not self._stop_event.is_set():
            if self._ser is None:
                time.sleep(RECONNECT_DELAY_S)
                continue
            try:
                chunk = self._ser.read(128)   # respeta timeout=0.2 s
            except serial.SerialException as e:
                logger.warning("SerialException en read(): %s", e)
                self._handle_disconnect()
                continue
            except Exception as e:
                logger.error("Error inesperado en read(): %s", e)
                time.sleep(0.1)
                continue

            if not chunk:
                continue

            buf.extend(chunk)
            while b"\n" in buf:
                line, _, rest = buf.partition(b"\n")
                buf = bytearray(rest)
                if len(line) > MAX_LINE_BYTES:
                    logger.warning("Línea descartada (>%d bytes)", MAX_LINE_BYTES)
                    continue
                line_str = line.decode("utf-8", errors="replace").strip()
                if not line_str:
                    continue
                try:
                    msg = json.loads(line_str)
                except json.JSONDecodeError as e:
                    logger.warning("JSON inválido del ESP32: %r (%s)", line_str, e)
                    continue
                logger.debug("RX %s", msg)
                self._rx_queue.put(msg)

    def _handle_disconnect(self):
        logger.warning("Enlace serial perdido")
        try:
            if self._ser is not None:
                self._ser.close()
        except Exception:
            pass
        self._ser = None
        if not self._auto_reconnect:
            return
        # bucle de reconexión
        while not self._stop_event.is_set():
            time.sleep(RECONNECT_DELAY_S)
            try:
                port = self._port_arg or autodetect_port()
                if port is None:
                    continue
                self._ser = serial.Serial(
                    port=port, baudrate=self._baud,
                    timeout=DEFAULT_TIMEOUT_S,
                )
                logger.info("Reconectado a %s", port)
                return
            except Exception as e:
                logger.debug("Intento de reconexión falló: %s", e)

    # -------------------------------------------------------------- send/recv
    def _next_seq(self):
        with self._seq_lock:
            self._seq = (self._seq % 0xFFFFFFFF) + 1
            return self._seq

    def _send_command(self, cmd, expect_response=True, timeout_s=RESPONSE_TIMEOUT_S):
        if self._ser is None:
            raise RuntimeError("No conectado. Llama a connect() primero.")
        seq = self._next_seq()
        payload = json.dumps({"cmd": cmd, "seq": seq}, separators=(",", ":"))
        line = (payload + "\n").encode("utf-8")
        logger.debug("TX %s", payload)
        try:
            self._ser.write(line)
            self._ser.flush()
        except serial.SerialException as e:
            self._handle_disconnect()
            raise

        if not expect_response:
            return None
        # Esperamos un motion_status con seq_ack == seq
        deadline = time.monotonic() + timeout_s
        while time.monotonic() < deadline:
            remaining = max(0.01, deadline - time.monotonic())
            try:
                msg = self._rx_queue.get(timeout=remaining)
            except Empty:
                break
            if msg.get("type") == "motion_status" and msg.get("seq_ack") == seq:
                return msg
            # otros mensajes (espontáneos, motion_status de cmds previos): los ignoramos
            logger.debug("Descartado mientras esperaba seq=%d: %s", seq, msg)
        raise TimeoutError(
            "No llegó motion_status para cmd=%s seq=%d en %.1f s" % (cmd, seq, timeout_s)
        )

    # -------------------------------------------------------------- API pública
    def ping(self, timeout_s=RESPONSE_TIMEOUT_S):
        return self._send_command("PING", timeout_s=timeout_s)

    def stop(self, timeout_s=RESPONSE_TIMEOUT_S):
        return self._send_command("STOP", timeout_s=timeout_s)

    def status(self, timeout_s=RESPONSE_TIMEOUT_S):
        return self._send_command("STATUS", timeout_s=timeout_s)

    def set_mode(self, mode, timeout_s=RESPONSE_TIMEOUT_S):
        mode = mode.lower()
        cmd_map = {"safe": "SET_SAFE", "manual": "SET_MANUAL", "auto": "SET_AUTO"}
        if mode not in cmd_map:
            raise ValueError("mode debe ser uno de: safe, manual, auto")
        return self._send_command(cmd_map[mode], timeout_s=timeout_s)

    def drain_async(self):
        """Devuelve y vacía todos los mensajes asíncronos pendientes."""
        out = []
        while True:
            try:
                out.append(self._rx_queue.get_nowait())
            except Empty:
                break
        return out