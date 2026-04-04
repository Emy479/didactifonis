/**
 * Gestión de Usuarios - Panel Admin
 * Verificar profesionales, activar/desactivar cuentas,
 * y reactivar pacientes eliminados.
 *
 * Endpoints utilizados:
 *   GET  /api/admin/usuarios              → listar usuarios
 *   PUT  /api/admin/usuarios/:id/verificar → verificar profesional
 *   PUT  /api/admin/usuarios/:id/estado    → activar/desactivar cuenta
 *   GET  /api/admin/pacientes/inactivos   → listar pacientes eliminados
 *   PUT  /api/admin/pacientes/:id/reactivar → reactivar paciente
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  listarUsuarios,
  verificarProfesional,
  cambiarEstadoUsuario,
  listarPacientesInactivos,
  reactivarPaciente,
} from "../../api/admin";
import {
  ArrowLeft,
  Users,
  BadgeCheck,
  UserX,
  UserCheck,
  RefreshCw,
  ChevronDown,
  Baby,
} from "lucide-react";

const ROL_ETIQUETA = {
  tutor: "Tutor",
  profesional: "Profesional",
  admin: "Admin",
};

const ROL_COLOR = {
  tutor: "bg-blue-100 text-blue-700",
  profesional: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
};

const ESPECIALIDAD_ETIQUETA = {
  fonoaudiologia: "Fonoaudiología",
  psicopedagogia: "Psicopedagogía",
  educacion_especial: "Educación Especial",
  terapia_lenguaje: "Terapia del Lenguaje",
  audiologia: "Audiología",
  neuropsicologia: "Neuropsicología",
  psicologia: "Psicología",
  otro: "Otro",
};

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonFila = () => (
  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
      <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
      <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
    </div>
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────────
const GestionUsuarios = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Pestaña activa: "usuarios" | "pacientes"
  const [pestana, setPestana] = useState("usuarios");

  // ── Estado usuarios ───────────────────────────────────────────────────────
  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [filtroRol, setFiltroRol] = useState(""); // "", "tutor", "profesional", "admin"
  const [accionUsuario, setAccionUsuario] = useState(null); // id en proceso

  // ── Estado pacientes inactivos ────────────────────────────────────────────
  const [pacientesInactivos, setPacientesInactivos] = useState([]);
  const [cargandoPacientes, setCargandoPacientes] = useState(false);
  const [reactivando, setReactivando] = useState(null); // id en proceso

  // ── Modal confirmación ────────────────────────────────────────────────────
  const [confirmar, setConfirmar] = useState(null);
  // { tipo: "desactivar"|"activar"|"reactivar", item, accion }

  // ── Cargar usuarios ───────────────────────────────────────────────────────
  const cargarUsuarios = useCallback(async () => {
    setCargandoUsuarios(true);
    try {
      const filtros = {};
      if (filtroRol) filtros.role = filtroRol;
      const res = await listarUsuarios(filtros);
      setUsuarios(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cargar usuarios");
    } finally {
      setCargandoUsuarios(false);
    }
  }, [filtroRol, toast]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // ── Cargar pacientes inactivos (solo al cambiar a esa pestaña) ────────────
  const cargarPacientesInactivos = useCallback(async () => {
    setCargandoPacientes(true);
    try {
      const res = await listarPacientesInactivos();
      setPacientesInactivos(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cargar pacientes");
    } finally {
      setCargandoPacientes(false);
    }
  }, [toast]);

  useEffect(() => {
    if (pestana === "pacientes") cargarPacientesInactivos();
  }, [pestana, cargarPacientesInactivos]);

  // ── Verificar / desverificar profesional ──────────────────────────────────
  const handleVerificar = async (usuario, verificado) => {
    setAccionUsuario(usuario._id);
    try {
      await verificarProfesional(usuario._id, verificado);
      toast.exito(
        verificado
          ? `${usuario.nombre} verificado correctamente`
          : `Verificación removida a ${usuario.nombre}`
      );
      await cargarUsuarios();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al actualizar verificación");
    } finally {
      setAccionUsuario(null);
    }
  };

  // ── Activar / desactivar cuenta ───────────────────────────────────────────
  const handleEstado = async () => {
    if (!confirmar) return;
    const { item, tipo } = confirmar;
    setConfirmar(null);
    setAccionUsuario(item._id);
    try {
      const activo = tipo === "activar";
      await cambiarEstadoUsuario(item._id, activo);
      toast.exito(
        activo
          ? `Cuenta de ${item.nombre} activada`
          : `Cuenta de ${item.nombre} desactivada`
      );
      await cargarUsuarios();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cambiar estado");
    } finally {
      setAccionUsuario(null);
    }
  };

  // ── Reactivar paciente ────────────────────────────────────────────────────
  const handleReactivar = async () => {
    if (!confirmar) return;
    const { item } = confirmar;
    setConfirmar(null);
    setReactivando(item._id);
    try {
      await reactivarPaciente(item._id);
      toast.exito(`${item.nombre} ${item.apellido} reactivado correctamente`);
      await cargarPacientesInactivos();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al reactivar paciente");
    } finally {
      setReactivando(null);
    }
  };

  // ── Helpers visuales ──────────────────────────────────────────────────────
  const iniciales = (nombre) =>
    nombre
      ?.split(" ")
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "?";

  const formatFecha = (fecha) =>
    fecha ? new Date(fecha).toLocaleDateString("es-CL") : "-";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">

        {/* Cabecera */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al panel
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Usuarios
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Verifica profesionales y administra cuentas
              </p>
            </div>
          </div>
        </div>

        {/* Pestañas */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
          <button
            onClick={() => setPestana("usuarios")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pestana === "usuarios"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Usuarios
          </button>
          <button
            onClick={() => setPestana("pacientes")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pestana === "pacientes"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pacientes Eliminados
          </button>
        </div>

        {/* ── PESTAÑA USUARIOS ── */}
        {pestana === "usuarios" && (
          <>
            {/* Filtro por rol */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <select
                  value={filtroRol}
                  onChange={(e) => setFiltroRol(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Todos los roles</option>
                  <option value="tutor">Tutores</option>
                  <option value="profesional">Profesionales</option>
                  <option value="admin">Admins</option>
                </select>
                <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <span className="text-sm text-gray-500">
                {!cargandoUsuarios && `${usuarios.length} usuarios`}
              </span>
            </div>

            {/* Lista usuarios */}
            {cargandoUsuarios ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonFila key={i} />
                ))}
              </div>
            ) : usuarios.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-400">No hay usuarios con ese filtro</p>
              </div>
            ) : (
              <div className="space-y-3">
                {usuarios.map((u) => (
                  <div
                    key={u._id}
                    className={`p-4 bg-white rounded-xl border transition-colors ${
                      !u.activo ? "border-red-100 opacity-60" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      {/* Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {iniciales(u.nombre)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">
                              {u.nombre}
                            </p>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROL_COLOR[u.role]}`}
                            >
                              {ROL_ETIQUETA[u.role]}
                            </span>
                            {u.role === "profesional" && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  u.verificado
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {u.verificado ? "✓ Verificado" : "Pendiente"}
                              </span>
                            )}
                            {!u.activo && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
                                Desactivado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {u.email}
                            {u.especialidad && (
                              <> · {ESPECIALIDAD_ETIQUETA[u.especialidad] || u.especialidad}</>
                            )}
                            {" · "}Desde {formatFecha(u.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Verificar (solo profesionales) */}
                        {u.role === "profesional" && (
                          <button
                            onClick={() => handleVerificar(u, !u.verificado)}
                            disabled={accionUsuario === u._id}
                            title={u.verificado ? "Quitar verificación" : "Verificar profesional"}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                              u.verificado
                                ? "text-green-600 hover:bg-green-50"
                                : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                            }`}
                          >
                            <BadgeCheck className="h-4 w-4" />
                          </button>
                        )}

                        {/* Activar / desactivar */}
                        {u.role !== "admin" && (
                          <button
                            onClick={() =>
                              setConfirmar({
                                tipo: u.activo ? "desactivar" : "activar",
                                item: u,
                              })
                            }
                            disabled={accionUsuario === u._id}
                            title={u.activo ? "Desactivar cuenta" : "Activar cuenta"}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                              u.activo
                                ? "text-gray-400 hover:text-red-600 hover:bg-red-50"
                                : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            }`}
                          >
                            {u.activo ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── PESTAÑA PACIENTES ELIMINADOS ── */}
        {pestana === "pacientes" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                {!cargandoPacientes && `${pacientesInactivos.length} pacientes eliminados`}
              </span>
              <button
                onClick={cargarPacientesInactivos}
                disabled={cargandoPacientes}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${cargandoPacientes ? "animate-spin" : ""}`} />
                Actualizar
              </button>
            </div>

            {cargandoPacientes ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonFila key={i} />
                ))}
              </div>
            ) : pacientesInactivos.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                <Baby className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">No hay pacientes eliminados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pacientesInactivos.map((p) => {
                  const creador = p.creadoPor;
                  const tutor = p.tutor || p.tutorInfo;
                  return (
                    <div
                      key={p._id}
                      className="p-4 bg-white rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        {/* Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {iniciales(`${p.nombre} ${p.apellido}`)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {p.nombre} {p.apellido}
                              <span className="ml-2 text-xs font-normal text-gray-400">
                                {p.edad} años
                              </span>
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {creador && (
                                <>Creado por {creador.nombre} · </>
                              )}
                              {tutor?.nombre && <>Tutor: {tutor.nombre} · </>}
                              Eliminado {formatFecha(p.updatedAt)}
                            </p>
                          </div>
                        </div>

                        {/* Reactivar */}
                        <button
                          onClick={() =>
                            setConfirmar({ tipo: "reactivar", item: p })
                          }
                          disabled={reactivando === p._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Reactivar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal confirmación ── */}
      {confirmar && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="bg-white rounded-2xl sm:rounded-2xl rounded-t-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  confirmar.tipo === "desactivar"
                    ? "bg-red-100"
                    : "bg-blue-100"
                }`}
              >
                {confirmar.tipo === "desactivar" ? (
                  <UserX className="h-5 w-5 text-red-600" />
                ) : confirmar.tipo === "reactivar" ? (
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                ) : (
                  <UserCheck className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <h3 className="text-base font-bold text-gray-900">
                {confirmar.tipo === "desactivar" && "¿Desactivar cuenta?"}
                {confirmar.tipo === "activar" && "¿Activar cuenta?"}
                {confirmar.tipo === "reactivar" && "¿Reactivar paciente?"}
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-5">
              {confirmar.tipo === "desactivar" && (
                <>
                  La cuenta de{" "}
                  <span className="font-semibold">{confirmar.item.nombre}</span>{" "}
                  quedará bloqueada y no podrá iniciar sesión.
                </>
              )}
              {confirmar.tipo === "activar" && (
                <>
                  Se restaurará el acceso de{" "}
                  <span className="font-semibold">{confirmar.item.nombre}</span>{" "}
                  a la plataforma.
                </>
              )}
              {confirmar.tipo === "reactivar" && (
                <>
                  El paciente{" "}
                  <span className="font-semibold">
                    {confirmar.item.nombre} {confirmar.item.apellido}
                  </span>{" "}
                  volverá a estar visible para su tutor y profesionales.
                </>
              )}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmar(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={
                  confirmar.tipo === "reactivar" ? handleReactivar : handleEstado
                }
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${
                  confirmar.tipo === "desactivar"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default GestionUsuarios;
