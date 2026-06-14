import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, register, deleteUser, changeUserPassword, updateUserName, changeUserRole, getAccessRequests, approveAccessRequest, rejectAccessRequest, ApiError } from "@/lib/api";
import { handleApiError } from "@/lib/errorHandler";
import type { UserRecord, UserRole, AccessRequestRecord, TierName } from "@/types/dashboard";
import { TIER_LABELS } from "@/types/dashboard";

const SUPER_ADMIN_EMAIL = "mango123@gmail.com";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Shield,
  Eye,
  EyeOff,
  KeyRound,
  Inbox,
  Check,
  X,
  Monitor,
  GraduationCap,
  Building2,
  Pencil,
} from "lucide-react";
import { DevicesPanel } from "@/components/admin/DevicesPanel";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DecryptedText from "@/components/effects/DecryptedText";
import GradientText from "@/components/effects/GradientText";
import BorderGlow from "@/components/effects/BorderGlow";

// ── Access Requests Panel ─────────────────────────────────────────────────────
function statusBadge(status: AccessRequestRecord["status"]) {
  if (status === "pending")  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">Pendiente</span>;
  if (status === "approved") return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Aprobado</span>;
  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30">Rechazado</span>;
}

function AccessRequestsPanel() {
  const queryClient = useQueryClient();
  const [rejectNote, setRejectNote] = useState<Record<number, string>>({});

  const requestsQuery = useQuery<{ requests: AccessRequestRecord[] }>({
    queryKey: ["admin-access-requests"],
    queryFn: () => getAccessRequests("pending"),
    refetchOnWindowFocus: false,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id }: { id: number }) => approveAccessRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-access-requests"] }),
    onError: (err) => handleApiError(err, { context: "admin/approve-request" }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => rejectAccessRequest(id, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-access-requests"] }),
    onError: (err) => handleApiError(err, { context: "admin/reject-request" }),
  });

  const pending = requestsQuery.data?.requests ?? [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Inbox className="h-4 w-4 text-[hsl(168,72%,42%)]" />
        <h2 className="text-sm font-semibold tracking-wide uppercase text-white/70">
          Solicitudes de Acceso
        </h2>
        {pending.length > 0 && (
          <span className="text-[11px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
            {pending.length} pendiente{pending.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <BorderGlow borderRadius={12} glowRadius={20} glowIntensity={0.5} colors={["#00c9a7", "#38bdf8", "#c084fc"]}>
        <div className="p-1">
          {requestsQuery.isLoading ? (
            <div className="flex items-center justify-center py-10 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-white/30" />
              <span className="text-sm text-white/30">Cargando…</span>
            </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-10 text-white/25 text-sm">
              Sin solicitudes pendientes
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {pending.map((req) => (
                <div key={req.id} className="px-4 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white/80 truncate">
                        {req.user_name || req.user_email}
                      </p>
                      <span className="text-[11px] text-white/35 font-mono">{req.user_email}</span>
                      {statusBadge(req.status)}
                    </div>
                    <p className="text-xs text-white/50 mt-0.5">
                      Solicita:{" "}
                      <span className="text-[hsl(168,72%,55%)] font-medium">
                        {TIER_LABELS[req.requested_tier as TierName] ?? req.requested_tier}
                      </span>
                      {" · "}
                      <span className="text-white/30">{new Date(req.created_at).toLocaleDateString("es-ES")}</span>
                    </p>
                    {req.motivation && (
                      <p className="text-[11px] text-white/40 mt-1 italic line-clamp-2">"{req.motivation}"</p>
                    )}
                    {req.status === "pending" && (
                      <input
                        type="text"
                        placeholder="Nota de rechazo (opcional)"
                        value={rejectNote[req.id] ?? ""}
                        onChange={(e) => setRejectNote((prev) => ({ ...prev, [req.id]: e.target.value }))}
                        className="mt-2 w-full max-w-xs bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-xs text-white/70 placeholder:text-white/25 outline-none focus:border-white/20"
                      />
                    )}
                  </div>
                  {req.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate({ id: req.id })}
                        disabled={approveMutation.isPending}
                        className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => rejectMutation.mutate({ id: req.id, note: rejectNote[req.id] ?? "" })}
                        disabled={rejectMutation.isPending}
                        className="text-red-400/60 hover:text-red-400 hover:bg-red-400/10 gap-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        Rechazar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </BorderGlow>
    </motion.section>
  );
}

type AdminTab = "perfiles" | "dispositivos";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>("perfiles");

  // Registration form state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regShowPw, setRegShowPw] = useState(false);
  const [regName, setRegName] = useState("");
  const [regRole, setRegRole] = useState<"estudiante" | "institucional">("estudiante");
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Password change state: userId → { open, value, show, error, success }
  const [pwState, setPwState] = useState<Record<number, {
    open: boolean; value: string; show: boolean; error: string | null; success: boolean;
  }>>({});

  // Name edit state: userId → { open, value, error, success }
  const [nameState, setNameState] = useState<Record<number, {
    open: boolean; value: string; error: string | null; success: boolean;
  }>>({});

  // Role edit state: userId → { open, value, error, success }
  const [roleState, setRoleState] = useState<Record<number, {
    open: boolean; value: string; error: string | null; success: boolean;
  }>>({});

  const togglePwRow = (id: number) =>
    setPwState((prev) => ({
      ...prev,
      [id]: prev[id]?.open
        ? { open: false, value: "", show: false, error: null, success: false }
        : { open: true, value: "", show: false, error: null, success: false },
    }));

  const toggleNameRow = (id: number, currentName: string) =>
    setNameState((prev) => ({
      ...prev,
      [id]: prev[id]?.open
        ? { open: false, value: "", error: null, success: false }
        : { open: true, value: currentName || "", error: null, success: false },
    }));

  const toggleRoleRow = (id: number, currentRole: string) =>
    setRoleState((prev) => ({
      ...prev,
      [id]: prev[id]?.open
        ? { open: false, value: "", error: null, success: false }
        : { open: true, value: currentRole, error: null, success: false },
    }));

  const nameChangeMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateUserName(id, name),
    onSuccess: (_, { id }) => {
      setNameState((prev) => ({
        ...prev,
        [id]: { open: false, value: "", error: null, success: true },
      }));
      setTimeout(() =>
        setNameState((prev) => ({ ...prev, [id]: { ...prev[id], success: false } })), 2500);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err, { id }) => {
      const msg = err instanceof ApiError ? err.message : "Error al actualizar nombre";
      setNameState((prev) => ({ ...prev, [id]: { ...prev[id], error: msg } }));
    },
  });

  const roleChangeMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => changeUserRole(id, role),
    onSuccess: (_, { id }) => {
      setRoleState((prev) => ({
        ...prev,
        [id]: { open: false, value: "", error: null, success: true },
      }));
      setTimeout(() =>
        setRoleState((prev) => ({ ...prev, [id]: { ...prev[id], success: false } })), 2500);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err, { id }) => {
      const msg = err instanceof ApiError ? err.message : "Error al cambiar categoría";
      setRoleState((prev) => ({ ...prev, [id]: { ...prev[id], error: msg } }));
    },
  });

  const pwChangeMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      changeUserPassword(id, password),
    onSuccess: (_, { id }) => {
      setPwState((prev) => ({
        ...prev,
        [id]: { open: false, value: "", show: false, error: null, success: true },
      }));
      setTimeout(() =>
        setPwState((prev) => ({ ...prev, [id]: { ...prev[id], success: false } })), 2500);
    },
    onError: (err, { id }) => {
      const msg = err instanceof ApiError ? err.message : "Error al cambiar contraseña";
      setPwState((prev) => ({ ...prev, [id]: { ...prev[id], error: msg } }));
    },
  });

  // Fetch users
  const usersQuery = useQuery<UserRecord[]>({
    queryKey: ["admin-users"],
    queryFn: getUsers,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (res) => {
      setRegSuccess(res.message || "Usuario registrado exitosamente.");
      setRegError(null);
      setRegEmail("");
      setRegPassword("");
      setRegName("");
      setRegRole("estudiante");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: unknown) => {
      setRegSuccess(null);
      handleApiError(err, { context: "admin/register" });
      if (err instanceof ApiError) {
        setRegError(err.message);
      } else {
        setRegError("Error al registrar usuario.");
      }
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: unknown) => handleApiError(err, { context: "admin/delete-user" }),
  });

  const handleRegister = (ev: React.FormEvent) => {
    ev.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regEmail || !regPassword || !regName) {
      setRegError("Todos los campos son obligatorios.");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    registerMutation.mutate({
      email: regEmail,
      password: regPassword,
      name: regName,
      role: regRole,
    });
  };

  const roleIcon = (role: UserRole) => {
    if (role === "admin")         return <Shield         className="h-3.5 w-3.5 text-amber-400"  />;
    if (role === "institucional") return <Building2      className="h-3.5 w-3.5 text-purple-400" />;
    return                               <GraduationCap className="h-3.5 w-3.5 text-blue-400"   />;
  };

  const roleLabel = (role: UserRole) => {
    if (role === "admin")         return "Administrador";
    if (role === "institucional") return "Institucional";
    return "Estudiante";
  };

  const roleColor = (role: UserRole) => {
    if (role === "admin")         return "text-amber-300";
    if (role === "institucional") return "text-purple-300";
    return "text-blue-300";
  };

  return (
    <div className="min-h-screen bg-[hsl(205,35%,8%)] relative">
      {/* Background accents */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_20%_80%,hsl(168_72%_42%/0.06),transparent_55%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_80%_20%,hsl(204_70%_53%/0.05),transparent_50%)] pointer-events-none" />

      <header className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-white/50 hover:text-white hover:bg-white/[0.06]"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
            <div className="h-5 w-px bg-white/10" />
            <h1 className="text-lg font-semibold text-white">
              Panel Administrador
            </h1>
          </div>

          {/* Tab selector */}
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1">
            <button
              type="button"
              onClick={() => setActiveTab("perfiles")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "perfiles"
                  ? "bg-white/[0.1] text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Perfiles
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("dispositivos")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "dispositivos"
                  ? "bg-white/[0.1] text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              Dispositivos
            </button>
          </div>

          <p className="text-xs text-white/40 hidden sm:block">
            {user?.email}
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 relative z-10">

        {/* ── TAB: DISPOSITIVOS ─────────────────────────────────────────── */}
        {activeTab === "dispositivos" && (
          <motion.div
            key="dispositivos"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DevicesPanel />
          </motion.div>
        )}

        {/* ── TAB: PERFILES ─────────────────────────────────────────────── */}
        {activeTab === "perfiles" && (
        <div className="space-y-8">
        {/* Registration Form */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-4 w-4 text-[hsl(168,72%,42%)]" />
            <h2 className="text-sm font-semibold tracking-wide uppercase text-white/70">
              Registrar Nuevo Usuario
            </h2>
          </div>

          <BorderGlow
            borderRadius={12}
            glowRadius={20}
            glowIntensity={0.5}
            colors={["#00c9a7", "#38bdf8", "#c084fc"]}
          >
            <form onSubmit={handleRegister} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs">Nombre completo</Label>
                  <Input
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="h-10 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/25 rounded-lg"
                    disabled={registerMutation.isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs">Email</Label>
                  <Input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="usuario@institucion.edu"
                    className="h-10 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/25 rounded-lg"
                    disabled={registerMutation.isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs">Contraseña</Label>
                  <div className="relative">
                    <Input
                      type={regShowPw ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="h-10 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/25 rounded-lg pr-10"
                      disabled={registerMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setRegShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      tabIndex={-1}
                    >
                      {regShowPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs">Categoria</Label>
                  <Select
                    value={regRole}
                    onValueChange={(v) => setRegRole(v as "estudiante" | "institucional")}
                    disabled={registerMutation.isPending}
                  >
                    <SelectTrigger className="h-10 bg-white/[0.05] border-white/[0.1] text-white rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estudiante">Estudiante</SelectItem>
                      <SelectItem value="institucional">Institucional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {regError && (
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {regError}
                </div>
              )}
              {regSuccess && (
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {regSuccess}
                </div>
              )}

              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="bg-gradient-to-r from-[hsl(168,72%,42%)] to-[hsl(204,70%,53%)] hover:from-[hsl(168,72%,38%)] hover:to-[hsl(204,70%,48%)] text-white rounded-lg font-medium"
              >
                {registerMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Registrar Usuario
              </Button>
            </form>
          </BorderGlow>
        </motion.section>

        {/* Users Table */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[hsl(168,72%,42%)]" />
              <h2 className="text-sm font-semibold tracking-wide uppercase text-white/70">
                Usuarios Registrados
              </h2>
              {usersQuery.data && (
                <span className="text-[11px] text-white/30 font-mono">
                  ({usersQuery.data.length})
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => usersQuery.refetch()}
              disabled={usersQuery.isFetching}
              className="text-white/30 hover:text-white/70 gap-1.5 text-xs"
            >
              {usersQuery.isFetching
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <CheckCircle2 className="h-3.5 w-3.5" />}
              Actualizar
            </Button>
          </div>

          <BorderGlow
            borderRadius={12}
            glowRadius={20}
            glowIntensity={0.5}
            colors={["#00c9a7", "#38bdf8", "#c084fc"]}
          >
            <div className="overflow-hidden rounded-xl">
              {usersQuery.isLoading ? (
                <div className="flex items-center justify-center py-14 gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-white/40" />
                  <span className="text-sm text-white/40">Cargando usuarios…</span>
                </div>
              ) : usersQuery.isError ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3 px-6 text-center">
                  <AlertCircle className="h-8 w-8 text-red-400/50" />
                  <p className="text-sm text-white/50">No se pudieron cargar los usuarios.</p>
                  <p className="text-xs text-white/30">
                    {usersQuery.error instanceof Error ? usersQuery.error.message : "Error de red"}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => usersQuery.refetch()}
                    className="text-white/40 hover:text-white/70 mt-1"
                  >
                    Reintentar
                  </Button>
                </div>
              ) : !usersQuery.data || usersQuery.data.length === 0 ? (
                <div className="text-center py-14 text-white/30 text-sm">
                  No hay usuarios registrados.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/[0.06] hover:bg-transparent">
                      <TableHead className="text-white/50 pl-5">Nombre</TableHead>
                      <TableHead className="text-white/50">Email</TableHead>
                      <TableHead className="text-white/50">Categoria</TableHead>
                      <TableHead className="text-white/50">Accesos</TableHead>
                      <TableHead className="text-white/50 text-right pr-5">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersQuery.data.map((u) => {
                      const isSuperAdmin = u.email === SUPER_ADMIN_EMAIL;
                      const canDelete = !isSuperAdmin;
                      const canEditRole = !isSuperAdmin;
                      const pw   = pwState[u.id];
                      const nm   = nameState[u.id];
                      const rl   = roleState[u.id];
                      return (
                        <>
                        <TableRow key={u.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                          <TableCell className="text-white/80 font-medium pl-5">
                            {u.name || <span className="text-white/30 italic">Sin nombre</span>}
                            {isSuperAdmin && (
                              <span className="ml-2 text-[10px] text-amber-400/80 font-semibold uppercase tracking-wide">
                                principal
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-white/55 text-sm font-mono">{u.email}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                              {roleIcon(u.role)}
                              <span className={roleColor(u.role)}>
                                {roleLabel(u.role)}
                              </span>
                            </span>
                          </TableCell>
                          <TableCell className="text-white/35 text-xs tabular-nums">
                            {u.login_count ?? 0}
                          </TableCell>
                          <TableCell className="text-right pr-5">
                            <div className="flex items-center justify-end gap-1">
                              {/* Edit name button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleNameRow(u.id, u.name || "")}
                                title="Editar nombre"
                                className={`${nm?.open ? "text-teal-400 bg-teal-400/10" : "text-white/30 hover:text-teal-400 hover:bg-teal-400/10"}`}
                              >
                                {nm?.success
                                  ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                  : <Pencil className="h-4 w-4" />}
                              </Button>
                              {/* Edit category/role button */}
                              {canEditRole && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRoleRow(u.id, u.role)}
                                  title="Cambiar categoria"
                                  className={`${rl?.open ? "text-purple-400 bg-purple-400/10" : "text-white/30 hover:text-purple-400 hover:bg-purple-400/10"}`}
                                >
                                  {rl?.success
                                    ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    : <GraduationCap className="h-4 w-4" />}
                                </Button>
                              )}
                              {/* Change password button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePwRow(u.id)}
                                title="Cambiar contraseña"
                                className={`${pw?.open ? "text-amber-400 bg-amber-400/10" : "text-white/30 hover:text-amber-400 hover:bg-amber-400/10"}`}
                              >
                                {pw?.success
                                  ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                  : <KeyRound className="h-4 w-4" />}
                              </Button>
                              {/* Delete button */}
                              {canDelete ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`¿Eliminar al usuario ${u.email}?`)) {
                                      deleteMutation.mutate(u.id);
                                    }
                                  }}
                                  disabled={deleteMutation.isPending}
                                  className="text-red-400/50 hover:text-red-400 hover:bg-red-400/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-[10px] text-white/20 pr-2">protegido</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Inline name edit row */}
                        {nm?.open && (
                          <TableRow key={`nm-${u.id}`} className="border-white/[0.04] bg-teal-500/[0.03]">
                            <TableCell colSpan={5} className="px-5 py-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] text-teal-300/70 font-medium whitespace-nowrap">
                                  Nombre para <span className="font-mono">{u.email}</span>:
                                </span>
                                <input
                                  type="text"
                                  value={nm.value}
                                  onChange={(e) =>
                                    setNameState((prev) => ({
                                      ...prev,
                                      [u.id]: { ...prev[u.id], value: e.target.value, error: null },
                                    }))
                                  }
                                  placeholder="Nombre completo"
                                  className="flex-1 min-w-[200px] max-w-xs bg-white/[0.05] border border-white/[0.12] rounded px-3 py-1.5 text-xs text-white placeholder:text-white/25 outline-none focus:border-teal-400/40"
                                />
                                <Button
                                  size="sm"
                                  disabled={nameChangeMutation.isPending}
                                  onClick={() => nameChangeMutation.mutate({ id: u.id, name: nm.value })}
                                  className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-xs h-7 px-3"
                                >
                                  {nameChangeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar"}
                                </Button>
                                <button
                                  type="button"
                                  onClick={() => toggleNameRow(u.id, u.name || "")}
                                  className="text-white/25 hover:text-white/50"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                                {nm.error && (
                                  <span className="text-[11px] text-red-400 w-full">{nm.error}</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}

                        {/* Inline role/category edit row */}
                        {rl?.open && (
                          <TableRow key={`rl-${u.id}`} className="border-white/[0.04] bg-purple-500/[0.03]">
                            <TableCell colSpan={5} className="px-5 py-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] text-purple-300/70 font-medium whitespace-nowrap">
                                  Categoria para <span className="font-mono">{u.email}</span>:
                                </span>
                                <select
                                  value={rl.value}
                                  onChange={(e) =>
                                    setRoleState((prev) => ({
                                      ...prev,
                                      [u.id]: { ...prev[u.id], value: e.target.value, error: null },
                                    }))
                                  }
                                  className="bg-white/[0.05] border border-white/[0.12] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-purple-400/40"
                                >
                                  <option value="estudiante">Estudiante</option>
                                  <option value="institucional">Institucional</option>
                                </select>
                                <Button
                                  size="sm"
                                  disabled={roleChangeMutation.isPending}
                                  onClick={() => roleChangeMutation.mutate({ id: u.id, role: rl.value })}
                                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs h-7 px-3"
                                >
                                  {roleChangeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar"}
                                </Button>
                                <button
                                  type="button"
                                  onClick={() => toggleRoleRow(u.id, u.role)}
                                  className="text-white/25 hover:text-white/50"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                                {rl.error && (
                                  <span className="text-[11px] text-red-400 w-full">{rl.error}</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}

                        {/* Inline password change row */}
                        {pw?.open && (
                          <TableRow key={`pw-${u.id}`} className="border-white/[0.04] bg-amber-500/[0.03]">
                            <TableCell colSpan={5} className="px-5 py-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] text-amber-300/70 font-medium whitespace-nowrap">
                                  Nueva contraseña para <span className="font-mono">{u.email}</span>:
                                </span>
                                <div className="relative flex-1 min-w-[200px] max-w-xs">
                                  <input
                                    type={pw.show ? "text" : "password"}
                                    value={pw.value}
                                    onChange={(e) =>
                                      setPwState((prev) => ({
                                        ...prev,
                                        [u.id]: { ...prev[u.id], value: e.target.value, error: null },
                                      }))
                                    }
                                    placeholder="Mínimo 8 caracteres"
                                    className="w-full bg-white/[0.05] border border-white/[0.12] rounded px-3 py-1.5 pr-9 text-xs text-white font-mono placeholder:text-white/25 outline-none focus:border-amber-400/40"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPwState((prev) => ({
                                        ...prev,
                                        [u.id]: { ...prev[u.id], show: !prev[u.id]?.show },
                                      }))
                                    }
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                                    tabIndex={-1}
                                  >
                                    {pw.show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                  </button>
                                </div>
                                <Button
                                  size="sm"
                                  disabled={pwChangeMutation.isPending || (pw.value?.length ?? 0) < 8}
                                  onClick={() => pwChangeMutation.mutate({ id: u.id, password: pw.value })}
                                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs h-7 px-3"
                                >
                                  {pwChangeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar"}
                                </Button>
                                <button
                                  type="button"
                                  onClick={() => togglePwRow(u.id)}
                                  className="text-white/25 hover:text-white/50 text-xs"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                                {pw.error && (
                                  <span className="text-[11px] text-red-400 w-full">{pw.error}</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </BorderGlow>
        </motion.section>

        {/* Access Requests */}
        <AccessRequestsPanel />

        {/* Footer */}
        <p className="text-center text-[11px] pb-6">
          <GradientText
            colors={["#00c9a7", "#38bdf8", "#c084fc", "#00c9a7"]}
            animationSpeed={10}
            className="text-[11px]"
          >
            M.A.N.G.O · Panel Administrador
          </GradientText>
        </p>
        </div>
        )}
      </main>
    </div>
  );
}
