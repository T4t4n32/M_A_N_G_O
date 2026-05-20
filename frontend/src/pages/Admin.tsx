import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, register, deleteUser, getAccessRequests, approveAccessRequest, rejectAccessRequest, ApiError } from "@/lib/api";
import { handleApiError } from "@/lib/errorHandler";
import type { UserRecord, UserRole, AccessRequestRecord, TierName } from "@/types/dashboard";
import { TIER_LABELS } from "@/types/dashboard";
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
  Inbox,
  Check,
  X,
} from "lucide-react";
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

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Registration form state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("viewer");
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

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
      setRegRole("viewer");
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

  const roleIcon = (role: UserRole) =>
    role === "admin" ? (
      <Shield className="h-3.5 w-3.5 text-amber-400" />
    ) : (
      <Eye className="h-3.5 w-3.5 text-blue-400" />
    );

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
              <DecryptedText
                text="Gestión de Usuarios"
                speed={35}
                maxIterations={6}
                animateOn="view"
                className="text-white"
                encryptedClassName="text-accent/30"
              />
            </h1>
          </div>
          <p className="text-xs text-white/40 hidden sm:block">
            {user?.email}
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 relative z-10">
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
                  <Input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="h-10 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/25 rounded-lg"
                    disabled={registerMutation.isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs">Rol</Label>
                  <Select
                    value={regRole}
                    onValueChange={(v) => setRegRole(v as UserRole)}
                    disabled={registerMutation.isPending}
                  >
                    <SelectTrigger className="h-10 bg-white/[0.05] border-white/[0.1] text-white rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
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
                      <TableHead className="text-white/50">Rol</TableHead>
                      <TableHead className="text-white/50">Accesos</TableHead>
                      <TableHead className="text-white/50 text-right pr-5">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersQuery.data.map((u) => {
                      const isSelf = u.email === user?.email;
                      const adminCount = usersQuery.data!.filter((x) => x.role === "admin").length;
                      const isLastAdmin = u.role === "admin" && adminCount <= 1;
                      const canDelete = !isSelf && !isLastAdmin;
                      return (
                        <TableRow key={u.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                          <TableCell className="text-white/80 font-medium pl-5">
                            {u.name || <span className="text-white/30 italic">Sin nombre</span>}
                            {isSelf && (
                              <span className="ml-2 text-[10px] text-[hsl(168,72%,50%)] font-semibold uppercase tracking-wide">
                                tú
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-white/55 text-sm font-mono">{u.email}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                              {roleIcon(u.role)}
                              <span className={u.role === "admin" ? "text-amber-300" : "text-blue-300"}>
                                {u.role}
                              </span>
                            </span>
                          </TableCell>
                          <TableCell className="text-white/35 text-xs tabular-nums">
                            {u.login_count ?? 0}
                          </TableCell>
                          <TableCell className="text-right pr-5">
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
                              <span className="text-[10px] text-white/20 pr-2">
                                {isSelf ? "—" : "protegido"}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
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
            M.A.N.G.O · Gestión de Usuarios
          </GradientText>
        </p>
      </main>
    </div>
  );
}
