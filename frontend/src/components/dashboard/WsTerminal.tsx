import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { Loader2, PlugZap, X, RotateCcw } from "lucide-react";

interface WsTerminalProps {
  /** WebSocket path, e.g. "/api/v1/admin/terminal/vps" */
  wsPath: string;
  title: string;
  accentClass: string;   // tailwind text color for accent
  badgeClass: string;    // tailwind bg/text for status badge
  /** If false, don't auto-connect on mount */
  autoConnect?: boolean;
}

type ConnState = "idle" | "connecting" | "connected" | "error" | "closed";

export function WsTerminal({
  wsPath,
  title,
  accentClass,
  badgeClass,
  autoConnect = true,
}: WsTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef      = useRef<Terminal | null>(null);
  const fitRef       = useRef<FitAddon | null>(null);
  const wsRef        = useRef<WebSocket | null>(null);
  const [connState, setConnState] = useState<ConnState>("idle");

  const connect = useCallback(() => {
    if (!containerRef.current) return;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnState("connecting");

    // Build WebSocket URL: wss:// or ws:// matching the page protocol
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const url   = `${proto}://${window.location.host}${wsPath}`;

    // Initialise xterm if not done yet
    if (!termRef.current) {
      const term = new Terminal({
        theme: {
          background:   "#0d0d0d",
          foreground:   "#d4d4d4",
          cursor:       "#00c9a7",
          cursorAccent: "#0d0d0d",
          black:        "#1e1e1e",
          red:          "#f44747",
          green:        "#4ec9b0",
          yellow:       "#dcdcaa",
          blue:         "#569cd6",
          magenta:      "#c678dd",
          cyan:         "#4ec9b0",
          white:        "#d4d4d4",
          brightBlack:  "#808080",
          brightRed:    "#f44747",
          brightGreen:  "#b5cea8",
          brightYellow: "#d7ba7d",
          brightBlue:   "#9cdcfe",
          brightMagenta:"#c586c0",
          brightCyan:   "#9cdcfe",
          brightWhite:  "#ffffff",
        },
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        fontSize:   13,
        lineHeight: 1.2,
        cursorBlink: true,
        cursorStyle: "block",
        allowProposedApi: true,
        scrollback: 2000,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(containerRef.current);
      fitAddon.fit();

      termRef.current = term;
      fitRef.current  = fitAddon;
    } else {
      // Reconnecting: clear and refit
      termRef.current.clear();
      fitRef.current?.fit();
    }

    const term = termRef.current!;
    const ws   = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnState("connected");
      // Send initial terminal size
      const { cols, rows } = term;
      ws.send(JSON.stringify({ type: "resize", cols, rows }));
    };

    ws.onmessage = (e) => {
      term.write(typeof e.data === "string" ? e.data : new Uint8Array(e.data));
    };

    ws.onclose = () => {
      setConnState("closed");
      term.write("\r\n\x1b[33m[Conexión cerrada — haz clic en Reconectar]\x1b[0m\r\n");
    };

    ws.onerror = () => {
      setConnState("error");
      term.write("\r\n\x1b[31m[Error de WebSocket — verifica que el túnel esté activo]\x1b[0m\r\n");
    };

    // Terminal input → WebSocket
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    // Terminal resize → send to backend
    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols, rows }));
      }
    });
  }, [wsPath]);

  // Fit on container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(() => {
      fitRef.current?.fit();
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) connect();
    return () => {
      wsRef.current?.close();
      termRef.current?.dispose();
      termRef.current = null;
      fitRef.current  = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const disconnect = () => {
    wsRef.current?.close();
    setConnState("closed");
  };

  const stateLabel: Record<ConnState, string> = {
    idle:       "INACTIVO",
    connecting: "CONECTANDO",
    connected:  "CONECTADO",
    error:      "ERROR",
    closed:     "DESCONECTADO",
  };

  const stateDot: Record<ConnState, string> = {
    idle:       "bg-white/30",
    connecting: "bg-amber-400 animate-pulse",
    connected:  "bg-emerald-400 animate-pulse",
    error:      "bg-red-400",
    closed:     "bg-white/30",
  };

  return (
    <div className="flex flex-col rounded-xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold tracking-widest uppercase ${accentClass}`}>
            {title}
          </span>
          <span className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${badgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${stateDot[connState]}`} />
            {stateLabel[connState]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {connState !== "connected" && (
            <button
              type="button"
              onClick={connect}
              title="Conectar / Reconectar"
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-white/40 hover:text-white/80 hover:bg-white/[0.06] border border-white/10 transition-colors"
            >
              {connState === "connecting"
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <RotateCcw className="h-3 w-3" />}
              {connState === "connecting" ? "Conectando…" : "Conectar"}
            </button>
          )}
          {connState === "connected" && (
            <button
              type="button"
              onClick={disconnect}
              title="Desconectar"
              className="p-1 rounded text-white/25 hover:text-red-400/70 hover:bg-red-400/10 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={connect}
            title="Reconectar"
            disabled={connState === "connecting"}
            className="p-1 rounded text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-colors disabled:opacity-40"
          >
            <PlugZap className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* xterm.js container */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 p-2"
        style={{ minHeight: "340px" }}
        onClick={() => termRef.current?.focus()}
      />
    </div>
  );
}
