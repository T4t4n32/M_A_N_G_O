"""Curses TUI for MANGO Hub.

Screens:
  - Main menu
  - Services   (list + start/stop/restart via initctl)
  - Files      (full filesystem browser, view, edit, delete)
  - Logs       (select log file, live tail)
  - System     (CPU, RAM, disk, network — auto-refresh)
  - Tunnel     (reverse SSH tunnel status + control)

Python 3.4 compatible: no f-strings, no subprocess.run(), no typing module.
"""

import curses
import curses.ascii
import os
import stat as stat_mod
import subprocess
import sys
import threading
import time
from collections import deque

from . import config
from .services import list_services, start_service, stop_service, restart_service, service_status
from .system_info import get_system_stats

_VPS_MODE = os.getenv("MANGO_HUB_MODE", "jetson") == "vps"

# ─── color pair indices ───────────────────────────────────────────────────────
C_HEADER = 1
C_GREEN  = 2
C_RED    = 3
C_YELLOW = 4
C_SEL    = 5
C_DIM    = 6
C_CYAN   = 7


def _setup_colors():
    if not curses.has_colors():
        return
    curses.start_color()
    try:
        curses.use_default_colors()
        bg = -1
    except Exception:
        bg = curses.COLOR_BLACK
    curses.init_pair(C_HEADER, curses.COLOR_CYAN,   bg)
    curses.init_pair(C_GREEN,  curses.COLOR_GREEN,  bg)
    curses.init_pair(C_RED,    curses.COLOR_RED,    bg)
    curses.init_pair(C_YELLOW, curses.COLOR_YELLOW, bg)
    curses.init_pair(C_SEL,    curses.COLOR_BLACK,  curses.COLOR_WHITE)
    curses.init_pair(C_DIM,    curses.COLOR_WHITE,  bg)
    curses.init_pair(C_CYAN,   curses.COLOR_CYAN,   bg)


# ─── primitive helpers ────────────────────────────────────────────────────────

def _safe_add(win, row, col, text, attr=0):
    h, w = win.getmaxyx()
    if row < 0 or row >= h - 1 or col >= w:
        return
    available = max(0, w - col - 1)
    if not available:
        return
    try:
        win.addstr(row, col, text[:available], attr)
    except curses.error:
        pass


def _draw_header(stdscr, subtitle):
    h, w = stdscr.getmaxyx()
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    title = " MANGO Hub  |  {}  |  {}  |  {} ".format(
        config.STATION_NAME, subtitle, ts)
    stdscr.clear()
    try:
        stdscr.addstr(0, 0, title.ljust(w)[:w],
                      curses.color_pair(C_HEADER) | curses.A_BOLD)
    except curses.error:
        pass


def _draw_footer(stdscr, hint):
    h, w = stdscr.getmaxyx()
    try:
        stdscr.addstr(h - 1, 0, hint[:w - 1].ljust(w - 1), curses.A_REVERSE)
    except curses.error:
        pass


def _confirm(stdscr, msg):
    h, w = stdscr.getmaxyx()
    row = h // 2
    prompt = "  {} [y/N]  ".format(msg)
    _safe_add(stdscr, row, 2, prompt,
              curses.color_pair(C_YELLOW) | curses.A_BOLD)
    stdscr.refresh()
    key = stdscr.getch()
    return key in (ord('y'), ord('Y'))


def _flash(stdscr, msg, attr=0):
    h, w = stdscr.getmaxyx()
    _safe_add(stdscr, h - 2, 2, msg[:w - 4].ljust(w - 4),
              attr or curses.color_pair(C_YELLOW))
    stdscr.refresh()
    time.sleep(1.0)


def _bar(pct, width=20):
    filled = int(round(float(pct) / 100.0 * width))
    filled = max(0, min(width, filled))
    return "#" * filled + "." * (width - filled)


def _fmt_size(n):
    for unit in ("B", "K", "M", "G", "T"):
        if n < 1024.0:
            return "{:>6.1f}{}".format(n, unit)
        n /= 1024.0
    return "{:>6.1f}P".format(n)


# ─── MAIN MENU ────────────────────────────────────────────────────────────────

_MENU = [
    ("1", "Services", "Start / stop / restart Upstart services"),
    ("2", "Files",    "Browse, view, and edit the filesystem"),
    ("3", "Logs",     "Tail service logs in real time"),
    ("4", "System",   "CPU, RAM, disk, network, uptime"),
    ("5", "Tunnel",   "Reverse SSH tunnel to VPS"),
]


def show_main_menu(stdscr):
    sel = 0
    while True:
        h, w = stdscr.getmaxyx()
        _draw_header(stdscr, "Main Menu")

        _safe_add(stdscr, 2, 4,
                  "Control centre for {}".format(config.STATION_NAME),
                  curses.color_pair(C_DIM))
        _safe_add(stdscr, 3, 4, "─" * min(56, w - 8))

        for i, (key, name, desc) in enumerate(_MENU):
            attr = curses.color_pair(C_SEL) if i == sel else 0
            line = "  [{}]  {:<12}  {}".format(key, name, desc)
            _safe_add(stdscr, 5 + i, 4, line.ljust(w - 8)[:w - 8], attr)

        _safe_add(stdscr, 5 + len(_MENU) + 1, 4, "  [q]  Quit")

        _draw_footer(stdscr,
            "Arrow keys or number key to select   Enter=open   q=Quit")
        stdscr.refresh()

        key = stdscr.getch()
        if key in (curses.KEY_UP, ord('k')) and sel > 0:
            sel -= 1
        elif key in (curses.KEY_DOWN, ord('j')) and sel < len(_MENU) - 1:
            sel += 1
        elif key in (curses.KEY_ENTER, ord('\n'), ord('\r')):
            return _MENU[sel][1].lower()
        elif 0 <= key < 256 and chr(key) in "12345":
            return _MENU[int(chr(key)) - 1][1].lower()
        elif key in (ord('q'), ord('Q'), curses.ascii.ESC):
            return None


# ─── SERVICES ─────────────────────────────────────────────────────────────────

def show_services(stdscr):
    sel = 0
    msg = ""
    while True:
        services = list_services()
        h, w     = stdscr.getmaxyx()
        _draw_header(stdscr, "Services")

        _safe_add(stdscr, 2, 4,
                  "{:<32}  {:<12}  {}".format("Service", "Status", "PID"),
                  curses.color_pair(C_HEADER))
        _safe_add(stdscr, 3, 4, "─" * min(56, w - 8))

        for i, svc in enumerate(services):
            name   = svc["name"]
            status = svc["status"]
            pid    = str(svc["pid"]) if svc["pid"] else "—"

            if status == "running":
                sc = curses.color_pair(C_GREEN)
                st = "RUNNING"
            elif status == "stopped":
                sc = curses.color_pair(C_RED)
                st = "STOPPED"
            else:
                sc = curses.color_pair(C_YELLOW)
                st = status.upper()[:12]

            row_attr = curses.color_pair(C_SEL) if i == sel else 0
            _safe_add(stdscr, 4 + i, 4,
                      " {:<32}".format(name).ljust(w - 8)[:w - 8], row_attr)
            if i != sel:
                _safe_add(stdscr, 4 + i, 37, "{:<12}".format(st), sc)
                _safe_add(stdscr, 4 + i, 51, pid)

        if msg:
            _safe_add(stdscr, h - 2, 4, msg[:w - 8],
                      curses.color_pair(C_YELLOW))
            msg = ""

        _draw_footer(stdscr,
            "Up/Down=select   S=start   s=stop   r=restart   q=back")
        stdscr.refresh()

        key = stdscr.getch()
        if key in (curses.KEY_UP, ord('k')) and sel > 0:
            sel -= 1
        elif key in (curses.KEY_DOWN, ord('j')) and sel < len(services) - 1:
            sel += 1
        elif key == ord('S'):
            _, out = start_service(services[sel]["name"])
            msg = out[:w - 10]
        elif key == ord('s'):
            _, out = stop_service(services[sel]["name"])
            msg = out[:w - 10]
        elif key in (ord('r'), ord('R')):
            _, out = restart_service(services[sel]["name"])
            msg = out[:w - 10]
        elif key in (ord('q'), ord('b'), curses.ascii.ESC):
            return


# ─── FILES ────────────────────────────────────────────────────────────────────

def _list_dir(path):
    entries = []
    try:
        names = sorted(os.listdir(path))
    except Exception:
        return entries
    for name in names:
        full = os.path.join(path, name)
        try:
            s      = os.stat(full)
            is_dir = stat_mod.S_ISDIR(s.st_mode)
            size   = s.st_size
            mtime  = time.strftime("%Y-%m-%d %H:%M",
                                   time.localtime(s.st_mtime))
            perms  = stat_mod.filemode(s.st_mode)
        except Exception:
            is_dir = False
            size   = 0
            mtime  = ""
            perms  = "----------"
        entries.append({
            "name":   name,
            "full":   full,
            "is_dir": is_dir,
            "size":   size,
            "mtime":  mtime,
            "perms":  perms,
        })
    dirs  = [e for e in entries if e["is_dir"]]
    files = [e for e in entries if not e["is_dir"]]
    return dirs + files


def _view_file(stdscr, filepath):
    try:
        with open(filepath, "rb") as f:
            raw = f.read(512 * 1024)
        lines = raw.decode("utf-8", "replace").splitlines()
    except Exception as e:
        lines = ["[error reading file: {}]".format(e)]

    scroll = 0
    while True:
        h, w    = stdscr.getmaxyx()
        visible = h - 3
        _draw_header(stdscr, "View: " + os.path.basename(filepath))

        for i in range(visible):
            idx  = scroll + i
            text = lines[idx].expandtabs(4) if idx < len(lines) else ""
            _safe_add(stdscr, 2 + i, 0, text[:w - 1])

        total = len(lines)
        shown = min(scroll + visible, total)
        info  = "Line {}-{} / {}".format(scroll + 1, shown, total)
        _draw_footer(stdscr,
            info + "   Up/Down/PgUp/PgDn/Home/End=scroll   q=back")
        stdscr.refresh()

        key = stdscr.getch()
        if key in (ord('q'), ord('b'), curses.ascii.ESC):
            return
        elif key == curses.KEY_UP and scroll > 0:
            scroll -= 1
        elif key == curses.KEY_DOWN and scroll < max(0, total - visible):
            scroll += 1
        elif key == curses.KEY_PPAGE:
            scroll = max(0, scroll - visible)
        elif key == curses.KEY_NPAGE:
            scroll = min(max(0, total - visible), scroll + visible)
        elif key == curses.KEY_HOME:
            scroll = 0
        elif key == curses.KEY_END:
            scroll = max(0, total - visible)


def show_files(stdscr):
    cwd    = "/"
    sel    = 0
    offset = 0
    msg    = ""

    while True:
        entries = _list_dir(cwd)
        h, w    = stdscr.getmaxyx()
        visible = h - 5

        _draw_header(stdscr, "Files: " + cwd)

        _safe_add(stdscr, 2, 2,
                  "{:<10}  {:>8}  {:<16}  {}".format(
                      "Perms", "Size", "Modified", "Name"),
                  curses.color_pair(C_HEADER))

        if sel < offset:
            offset = sel
        elif sel >= offset + visible:
            offset = sel - visible + 1

        for i in range(visible):
            idx = offset + i
            if idx >= len(entries):
                _safe_add(stdscr, 3 + i, 0, " " * (w - 1))
                continue
            e = entries[idx]
            name_disp = (e["name"] + "/") if e["is_dir"] else e["name"]
            size_disp = "<DIR>   " if e["is_dir"] else _fmt_size(e["size"])
            line = "{:<10}  {:>8}  {:<16}  {}".format(
                e["perms"], size_disp, e["mtime"], name_disp)

            if idx == sel:
                attr = curses.color_pair(C_SEL)
            elif e["is_dir"]:
                attr = curses.color_pair(C_CYAN)
            else:
                attr = 0
            _safe_add(stdscr, 3 + i, 2, line[:w - 4], attr)

        count_info = "{}/{}".format(sel + 1, len(entries)) if entries else "empty"
        _safe_add(stdscr, h - 3, 2,
                  "  [{}/{}]  q=back  Enter=open  e=edit  d=delete  b=up  g=goto".format(
                      sel + 1, len(entries))[:w - 4])

        if msg:
            _safe_add(stdscr, h - 2, 2, msg[:w - 4],
                      curses.color_pair(C_YELLOW))
            msg = ""

        _draw_footer(stdscr,
            "Enter=open  e=edit  d=delete  b/Left=up  g=goto path  q=back")
        stdscr.refresh()

        key = stdscr.getch()
        if key in (curses.KEY_UP, ord('k')) and sel > 0:
            sel -= 1
        elif key in (curses.KEY_DOWN, ord('j')) and sel < len(entries) - 1:
            sel += 1
        elif key == curses.KEY_PPAGE:
            sel = max(0, sel - visible)
        elif key == curses.KEY_NPAGE:
            sel = min(max(0, len(entries) - 1), sel + visible)

        elif key in (curses.KEY_ENTER, ord('\n'), ord('\r')):
            if entries:
                e = entries[sel]
                if e["is_dir"]:
                    cwd = e["full"]
                    sel = 0
                    offset = 0
                else:
                    _view_file(stdscr, e["full"])

        elif key in (ord('b'), curses.KEY_BACKSPACE, curses.KEY_LEFT,
                     curses.ascii.BS):
            parent = os.path.dirname(cwd.rstrip("/")) or "/"
            if parent != cwd:
                cwd = parent
                sel = 0
                offset = 0

        elif key == ord('e') and entries:
            e = entries[sel]
            if not e["is_dir"]:
                curses.endwin()
                editor = config.EDITOR
                subprocess.call([editor, e["full"]])
                stdscr.refresh()

        elif key == ord('d') and entries:
            e = entries[sel]
            if _confirm(stdscr, "Delete {}?".format(e["name"])):
                try:
                    if e["is_dir"]:
                        os.rmdir(e["full"])
                    else:
                        os.remove(e["full"])
                    sel = max(0, sel - 1)
                    msg = "Deleted: {}".format(e["name"])
                except Exception as ex:
                    msg = "Error: {}".format(ex)

        elif key == ord('g'):
            curses.echo()
            curses.curs_set(1)
            h2, w2 = stdscr.getmaxyx()
            _safe_add(stdscr, h2 - 2, 2, "Goto: " + " " * (w2 - 10))
            stdscr.move(h2 - 2, 8)
            stdscr.refresh()
            try:
                typed = stdscr.getstr(
                    h2 - 2, 8, w2 - 12
                ).decode("utf-8", "ignore").strip()
            except Exception:
                typed = ""
            curses.noecho()
            curses.curs_set(0)
            if typed and os.path.isdir(typed):
                cwd = typed
                sel = 0
                offset = 0
            elif typed:
                msg = "Not a directory: {}".format(typed)

        elif key in (ord('q'), curses.ascii.ESC):
            return


# ─── LOGS ─────────────────────────────────────────────────────────────────────

def _tail_log(stdscr, filepath):
    lines   = deque(maxlen=500)
    stop_ev = threading.Event()

    def _reader():
        try:
            proc = subprocess.Popen(
                ["tail", "-n", "80", "-f", filepath],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
            )
            while not stop_ev.is_set():
                line = proc.stdout.readline()
                if line:
                    lines.append(line.decode("utf-8", "ignore").rstrip())
                else:
                    time.sleep(0.05)
            try:
                proc.terminate()
            except Exception:
                pass
        except Exception as e:
            lines.append("[reader error: {}]".format(e))

    t = threading.Thread(target=_reader)
    t.daemon = True
    t.start()

    scroll   = 0
    last_len = 0
    stdscr.nodelay(True)

    try:
        while True:
            h, w    = stdscr.getmaxyx()
            visible = h - 3
            current = list(lines)

            if len(current) != last_len:
                last_len = len(current)
                scroll   = max(0, len(current) - visible)

            _draw_header(stdscr, "Log: " + os.path.basename(filepath))

            for i in range(visible):
                idx  = scroll + i
                text = current[idx] if idx < len(current) else ""
                _safe_add(stdscr, 2 + i, 0, text[:w - 1])

            _draw_footer(stdscr,
                "Up/Down/Home/End=scroll   f=follow end   q=back   (live tail)")
            stdscr.refresh()

            key = stdscr.getch()
            if key in (ord('q'), ord('b'), curses.ascii.ESC):
                break
            elif key == curses.KEY_UP and scroll > 0:
                scroll -= 1
            elif key == curses.KEY_DOWN and scroll < max(0, len(current) - visible):
                scroll += 1
            elif key == curses.KEY_HOME:
                scroll = 0
            elif key in (curses.KEY_END, ord('f')):
                scroll = max(0, len(current) - visible)

            time.sleep(0.1)
    finally:
        stop_ev.set()
        stdscr.nodelay(False)
        t.join(timeout=2.0)


def show_logs(stdscr):
    log_dir = config.LOG_DIR
    sel     = 0

    while True:
        try:
            files = sorted(
                [f for f in os.listdir(log_dir) if f.endswith(".log")]
            )
        except Exception:
            files = []

        h, w = stdscr.getmaxyx()
        _draw_header(stdscr, "Logs")

        _safe_add(stdscr, 2, 4,
                  "Directory: {}".format(log_dir),
                  curses.color_pair(C_DIM))
        _safe_add(stdscr, 3, 4, "─" * min(56, w - 8))

        if not files:
            _safe_add(stdscr, 5, 4,
                      "(no .log files found)",
                      curses.color_pair(C_YELLOW))
        else:
            for i, fname in enumerate(files):
                fpath = os.path.join(log_dir, fname)
                try:
                    size  = _fmt_size(os.path.getsize(fpath))
                    mtime = time.strftime("%Y-%m-%d %H:%M",
                                          time.localtime(
                                              os.path.getmtime(fpath)))
                except Exception:
                    size  = "     ?"
                    mtime = ""
                attr = curses.color_pair(C_SEL) if i == sel else 0
                line = "  {}  {:<16}  {}".format(size, mtime, fname)
                _safe_add(stdscr, 4 + i, 4, line[:w - 8], attr)

        _draw_footer(stdscr, "Enter=tail   Up/Down=select   q=back")
        stdscr.refresh()

        key = stdscr.getch()
        if key in (curses.KEY_UP, ord('k')) and sel > 0:
            sel -= 1
        elif key in (curses.KEY_DOWN, ord('j')) and files and sel < len(files) - 1:
            sel += 1
        elif key in (curses.KEY_ENTER, ord('\n'), ord('\r')) and files:
            _tail_log(stdscr, os.path.join(log_dir, files[sel]))
        elif key in (ord('q'), ord('b'), curses.ascii.ESC):
            return


# ─── SYSTEM ───────────────────────────────────────────────────────────────────

def show_system(stdscr):
    stdscr.nodelay(True)
    try:
        while True:
            stats = get_system_stats()
            h, w  = stdscr.getmaxyx()
            _draw_header(stdscr, "System")

            row = 2

            # CPU
            cpu     = stats["cpu"]
            cpu_bar = _bar(cpu)
            cpu_c   = curses.color_pair(C_GREEN) if cpu < 70 else curses.color_pair(C_RED)
            _safe_add(stdscr, row, 4,
                      "CPU     {:>5.1f}%  [{}]".format(cpu, cpu_bar), cpu_c)
            row += 1

            # Load average
            l1, l5, l15 = stats["load"]
            _safe_add(stdscr, row, 4,
                      "Load    {} / {} / {}  (1m / 5m / 15m)".format(l1, l5, l15))
            row += 2

            # Memory
            mem     = stats["mem"]
            mem_bar = _bar(mem["percent"])
            mem_c   = curses.color_pair(C_GREEN) if mem["percent"] < 80 else curses.color_pair(C_RED)
            _safe_add(stdscr, row, 4,
                      "RAM     {:>5.1f}%  [{}]  {} / {} MB".format(
                          mem["percent"], mem_bar,
                          mem["used_mb"], mem["total_mb"]), mem_c)
            row += 2

            # Disk
            disk     = stats["disk"]
            disk_bar = _bar(disk["percent"])
            disk_c   = curses.color_pair(C_GREEN) if disk["percent"] < 85 else curses.color_pair(C_RED)
            _safe_add(stdscr, row, 4,
                      "Disk    {:>5.1f}%  [{}]  {:.1f} / {:.1f} GB".format(
                          disk["percent"], disk_bar,
                          disk["used_gb"], disk["total_gb"]), disk_c)
            row += 2

            # Uptime
            _safe_add(stdscr, row, 4,
                      "Uptime  {}".format(stats["uptime"]))
            row += 2

            # Network
            _safe_add(stdscr, row, 4, "Network",
                      curses.color_pair(C_HEADER) | curses.A_BOLD)
            row += 1
            _safe_add(stdscr, row, 4, "─" * min(56, w - 8))
            row += 1
            for iface in stats["net"]:
                if row >= h - 2:
                    break
                up   = iface["state"] == "UP"
                ic   = curses.color_pair(C_GREEN) if up else curses.color_pair(C_RED)
                addrs = "  ".join(iface["addrs"]) if iface["addrs"] else "(no addr)"
                _safe_add(stdscr, row, 6,
                          "{:<14}  {:<6}  {}".format(
                              iface["name"], iface["state"], addrs), ic)
                row += 1

            _draw_footer(stdscr, "Auto-refresh every 2s   q=back")
            stdscr.refresh()

            for _ in range(20):
                key = stdscr.getch()
                if key in (ord('q'), ord('b'), curses.ascii.ESC):
                    return
                time.sleep(0.1)
    finally:
        stdscr.nodelay(False)


# ─── TUNNEL ───────────────────────────────────────────────────────────────────

def show_tunnel(stdscr):
    msg = ""
    while True:
        h, w = stdscr.getmaxyx()
        _draw_header(stdscr, "Tunnel")

        row = 2
        _safe_add(stdscr, row, 4,
                  "Reverse SSH Tunnel — Jetson <-> VPS",
                  curses.color_pair(C_HEADER) | curses.A_BOLD)
        row += 2

        if _VPS_MODE:
            # On the VPS: show whether the Jetson is currently connected
            from .services_docker import tunnel_jetson_connected
            connected = tunnel_jetson_connected(config.TUNNEL_R_PORT)
            sc = curses.color_pair(C_GREEN) if connected else curses.color_pair(C_RED)
            st = "JETSON CONNECTED" if connected else "JETSON NOT CONNECTED"
            _safe_add(stdscr, row, 4, "Tunnel port  : {}".format(config.TUNNEL_R_PORT)); row += 1
            _safe_add(stdscr, row, 4, "Jetson status: ")
            _safe_add(stdscr, row, 21, st, sc | curses.A_BOLD)
            row += 2
            if connected:
                _safe_add(stdscr, row, 4,
                          "Connect:  ssh -p {} ubuntu@localhost".format(
                              config.TUNNEL_R_PORT),
                          curses.color_pair(C_DIM))
            _draw_footer(stdscr, "Auto-refresh on next key   q=back")
        else:
            # On the Jetson: show tunnel service status + controls
            status, pid = service_status("mango-tunnel")
            vps = config.VPS_HOST or "(not set — add MANGO_VPS_HOST to .env)"
            _safe_add(stdscr, row, 4, "VPS Host     : {}".format(vps)); row += 1
            _safe_add(stdscr, row, 4, "VPS SSH port : {}".format(config.VPS_SSH_PORT)); row += 1
            _safe_add(stdscr, row, 4, "Remote port  : {}".format(config.TUNNEL_R_PORT)); row += 1
            _safe_add(stdscr, row, 4, "SSH key      : {}".format(config.SSH_KEY)); row += 2

            if status == "running":
                sc = curses.color_pair(C_GREEN)
                st = "RUNNING  (PID {})".format(pid or "?")
            elif status == "stopped":
                sc = curses.color_pair(C_RED)
                st = "STOPPED"
            else:
                sc = curses.color_pair(C_YELLOW)
                st = status.upper()

            _safe_add(stdscr, row, 4, "Status       : ")
            _safe_add(stdscr, row, 21, st, sc | curses.A_BOLD)
            row += 2

            if config.VPS_HOST:
                _safe_add(stdscr, row, 4,
                          "From VPS:  ssh -p {} ubuntu@localhost".format(
                              config.TUNNEL_R_PORT),
                          curses.color_pair(C_DIM))
                row += 1

            _draw_footer(stdscr, "S=start   s=stop   r=restart   q=back")

        if msg:
            _safe_add(stdscr, h - 2, 4, msg[:w - 8],
                      curses.color_pair(C_YELLOW))
            msg = ""

        stdscr.refresh()

        key = stdscr.getch()
        if not _VPS_MODE:
            if key == ord('S'):
                _, out = start_service("mango-tunnel")
                msg = out[:w - 10]
            elif key == ord('s'):
                _, out = stop_service("mango-tunnel")
                msg = out[:w - 10]
            elif key in (ord('r'), ord('R')):
                _, out = restart_service("mango-tunnel")
                msg = out[:w - 10]
        if key in (ord('q'), ord('b'), curses.ascii.ESC):
            return


# ─── ENTRY POINT ──────────────────────────────────────────────────────────────

def _main(stdscr):
    _setup_colors()
    curses.curs_set(0)
    stdscr.keypad(True)

    while True:
        action = show_main_menu(stdscr)
        if action is None:
            break
        elif action == "services":
            show_services(stdscr)
        elif action == "files":
            show_files(stdscr)
        elif action == "logs":
            show_logs(stdscr)
        elif action == "system":
            show_system(stdscr)
        elif action == "tunnel":
            show_tunnel(stdscr)


def run_tui():
    try:
        curses.wrapper(_main)
    except KeyboardInterrupt:
        pass
    except Exception as e:
        sys.stderr.write("mango-hub error: {}\n".format(e))
        sys.exit(1)
