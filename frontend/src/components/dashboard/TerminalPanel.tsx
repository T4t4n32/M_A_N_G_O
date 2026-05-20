import { useRef, useState, useEffect } from "react";
import { Terminal, Server, Cpu, Send, Loader2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { execCommand, ApiError } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

type Target = "vps" | "jetson";

interface OutputLine {
  kind: "command" | "stdout" | "stderr" | "meta";
  text: string;
}

const PRESET_COMMANDS: { label: string; cmd: string }[] = [
  { label: "Estado del sistema", cmd: "uptime" },
  { label: "Uso de disco", cmd: "df -h /" },
  { label: "Memoria libre", cmd: "free -h" },
  { label: "Procesos top", cmd: "ps aux --sort=-%cpu | head -10" },
  { label: "IP y red", cmd: "ip addr show" },
  { label: "Logs del backend", cmd: "docker logs mango_backend --tail 30" },
];

interface TerminalPanelProps {
  defaultOpen?: boolean;
}

export function TerminalPanel({ defaultOpen = false }: TerminalPanelProps) {
  const [target, setTarget] = useState<Target>("vps");
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(!defaultOpen);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const run = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setOutput((prev) => [...prev, { kind: "command", text: `$ [${target}] ${trimmed}` }]);
    setHistory((prev) => [trimmed, ...prev.slice(0, 49)]);
    setHistIdx(-1);
    setCommand("");
    setLoading(true);

    try {
      const res = await execCommand(trimmed, target);
      if (res.stdout) {
        res.stdout.split("\n").forEach((line) => {
          setOutput((prev) => [...prev, { kind: "stdout", text: line }]);
        });
      }
      if (res.stderr) {
        res.stderr.split("\n").forEach((line) => {
          if (line.trim()) setOutput((prev) => [...prev, { kind: "stderr", text: line }]);
        });
      }
      setOutput((prev) => [
        ...prev,
        { kind: "meta", text: `[exit ${res.returncode}]` },
      ]);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error desconocido";
      setOutput((prev) => [...prev, { kind: "stderr", text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(command);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setCommand(history[next] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setCommand(next === -1 ? "" : (history[next] ?? ""));
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[hsl(205,35%,9%)] overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors cursor-pointer"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-[hsl(168,72%,42%)]" />
          <span className="text-sm font-semibold text-white/80">Terminal Remota</span>
          <span className="text-xs text-white/30 hidden sm:inline">— Solo administradores</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-white/40">
            <span className={`w-2 h-2 rounded-full ${target === "vps" ? "bg-emerald-400" : "bg-sky-400"} animate-pulse`} />
            {target.toUpperCase()}
          </div>
          {collapsed ? <ChevronDown className="h-4 w-4 text-white/30" /> : <ChevronUp className="h-4 w-4 text-white/30" />}
        </div>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Target selector */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.015]">
              <span className="text-[11px] text-white/40 uppercase tracking-wider">Destino:</span>
              {(["vps", "jetson"] as Target[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTarget(t)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border transition-all ${
                    target === t
                      ? t === "vps"
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-sky-500/15 text-sky-300 border-sky-500/30"
                      : "bg-white/[0.03] text-white/40 border-white/10 hover:text-white/70"
                  }`}
                >
                  {t === "vps" ? <Server className="h-3 w-3" /> : <Cpu className="h-3 w-3" />}
                  {t.toUpperCase()}
                </button>
              ))}
              {target === "jetson" && (
                <span className="ml-auto flex items-center gap-1 text-[10px] text-amber-400/70">
                  <AlertTriangle className="h-3 w-3" />
                  Requiere JETSON_HOST configurado
                </span>
              )}
            </div>

            {/* Quick presets */}
            <div className="flex gap-1.5 flex-wrap px-4 py-2 border-b border-white/[0.05] bg-white/[0.01]">
              {PRESET_COMMANDS.map(({ label, cmd }) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => run(cmd)}
                  disabled={loading}
                  className="px-2 py-1 rounded text-[10px] text-white/50 border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:text-white/80 transition-colors disabled:opacity-40"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Output area */}
            <div
              ref={outputRef}
              className="h-64 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed space-y-0.5 bg-black"
              onClick={() => inputRef.current?.focus()}
            >
              {output.length === 0 && (
                <p className="text-white/20 italic">Escribe un comando o elige un atajo arriba…</p>
              )}
              {output.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.kind === "command"
                      ? "text-[hsl(168,72%,55%)]"
                      : line.kind === "stderr"
                        ? "text-red-400"
                        : line.kind === "meta"
                          ? "text-white/30 italic"
                          : "text-[#39d353]"
                  }
                >
                  {line.text || " "}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-white/30">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Ejecutando…
                </div>
              )}
            </div>

            {/* Input row */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-t border-white/[0.08] bg-[#0a0a0a]">
              <span className="font-mono text-xs text-[hsl(168,72%,42%)] shrink-0">$</span>
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Comando para ${target.toUpperCase()}…`}
                disabled={loading}
                spellCheck={false}
                autoComplete="off"
                className="flex-1 bg-transparent font-mono text-xs text-white/80 placeholder:text-white/20 outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => run(command)}
                disabled={loading || !command.trim()}
                className="shrink-0 p-1.5 rounded-md bg-[hsl(168,72%,42%/0.15)] text-[hsl(168,72%,55%)] border border-[hsl(168,72%,42%/0.25)] hover:bg-[hsl(168,72%,42%/0.25)] disabled:opacity-40 transition-colors"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
