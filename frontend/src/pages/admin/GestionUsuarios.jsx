/**
 * Gestión de Usuarios - Panel Admin
 * Verificar profesionales, activar/desactivar cuentas,
 * cuentas inactivas con log de fechas y feedback de offboarding,
 * y reactivar pacientes eliminados.
 *
 * Endpoints:
 *   GET  /api/admin/usuarios                → listar usuarios activos
 *   GET  /api/admin/usuarios?activo=false   → listar usuarios inactivos
 *   PUT  /api/admin/usuarios/:id/verificar  → verificar profesional
 *   PUT  /api/admin/usuarios/:id/estado     → activar/desactivar cuenta
 *   GET  /api/admin/pacientes/inactivos     → listar pacientes eliminados
 *   PUT  /api/admin/pacientes/:id/reactivar → reactivar paciente
 *   GET  /api/offboarding/feedbacks         → feedbacks de offboarding
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
  listarFeedbacksOffboarding,
} from "../../api/admin";
import {
  ArrowLeft, Users, BadgeCheck, UserX, UserCheck,
  RefreshCw, ChevronDown, Baby, MessageSquare, X,
  Calendar, Clock,
} from "lucide-react";

const ROL_ETIQUETA = { tutor: "Tutor", profesional: "Profesional", admin: "Admin" };

const ROL_COLOR = {
  tutor: "bg-blue-100 text-blue-700",
  profesional: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
};

const ESPECIALIDAD_ETIQUETA = {
  fonoaudiologia: "Fonoaudiología", psicopedagogia: "Psicopedagogía",
  educacion_especial: "Educación Especial", terapia_lenguaje: "Terapia del Lenguaje",
  audiologia: "Audiología", neuropsicologia: "Neuropsicología",
  psicologia: "Psicología", otro: "Otro",
};

const MOTIVO_ETIQUETA = {
  precio: "Precio no ajustado", juegos: "Falta de juegos",
  tecnico: "Dificultades técnicas", sin_necesidad: "Ya no necesita el servicio",
  competencia: "Se fue a otra plataforma", otro: "Otro",
};

const RECOMIENDA_ETIQUETA = { si: "👍 Sí", tal_vez: "🤔 Tal vez", no: "👎 No" };

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

const GestionUsuarios = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [pestana, setPestana] = useState("usuarios");

  // Usuarios activos
  const [usuarios, setUsuarios]                   = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios]   = useState(true);
  const [filtroRol, setFiltroRol]                 = useState("");
  const [accionUsuario, setAccionUsuario]         = useState(null);

  // Cuentas inactivas
  const [inactivos, setInactivos]                   = useState([]);
  const [cargandoInactivos, setCargandoInactivos]   = useState(false);
  const [feedbacks, setFeedbacks]                   = useState({});
  const [modalFeedback, setModalFeedback]           = useState(null);

  // Pacientes eliminados
  const [pacientesInactivos, setPacientesInactivos] = useState([]);
  const [cargandoPacientes, setCargandoPacientes]   = useState(false);
  const [reactivando, setReactivando]               = useState(null);

  // Modal confirmación
  const [confirmar, setConfirmar] = useState(null);

  // ── Cargar usuarios activos ───────────────────────────────────────────────
  const cargarUsuarios = useCallback(async () => {
    setCargandoUsuarios(true);
    try {
      const filtros = { activo: "true" };
      if (filtroRol) filtros.role = filtroRol;
      const res = await listarUsuarios(filtros);
      setUsuarios(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cargar usuarios");
    } finally { setCargandoUsuarios(false); }
  }, [filtroRol, toast]);

  useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);

  // ── Cargar cuentas inactivas + feedbacks ──────────────────────────────────
  const cargarInactivos = useCallback(async () => {
    setCargandoInactivos(true);
    try {
      const [resInactivos, resFeedbacks] = await Promise.all([
        listarUsuarios({ activo: "false" }),
        listarFeedbacksOffboarding(),
      ]);
      setInactivos(resInactivos.data);
      // Mapear feedbacks por usuario id para acceso O(1)
      const mapa = {};
      resFeedbacks.data.forEach((f) => {
        const uid = f.usuario?._id || f.usuario;
        if (uid) mapa[uid] = f;
      });
      setFeedbacks(mapa);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cargar cuentas inactivas");
    } finally { setCargandoInactivos(false); }
  }, [toast]);

  useEffect(() => {
    if (pestana === "inactivos") cargarInactivos();
  }, [pestana, cargarInactivos]);

  // ── Cargar pacientes inactivos ────────────────────────────────────────────
  const cargarPacientesInactivos = useCallback(async () => {
    setCargandoPacientes(true);
    try {
      const res = await listarPacientesInactivos();
      setPacientesInactivos(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cargar pacientes");
    } finally { setCargandoPacientes(false); }
  }, [toast]);

  useEffect(() => {
    if (pestana === "pacientes") cargarPacientesInactivos();
  }, [pestana, cargarPacientesInactivos]);

  // ── Acciones ──────────────────────────────────────────────────────────────
  const handleVerificar = async (usuario, verificado) => {
    setAccionUsuario(usuario._id);
    try {
      await verificarProfesional(usuario._id, verificado);
      toast.exito(verificado ? `${usuario.nombre} verificado` : `Verificación removida a ${usuario.nombre}`);
      await cargarUsuarios();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al actualizar verificación");
    } finally { setAccionUsuario(null); }
  };

  const handleEstado = async () => {
    if (!confirmar) return;
    const { item, tipo } = confirmar;
    setConfirmar(null);
    setAccionUsuario(item._id);
    try {
      const activo = tipo === "activar";
      await cambiarEstadoUsuario(item._id, activo);
      toast.exito(activo ? `Cuenta de ${item.nombre} activada` : `Cuenta de ${item.nombre} desactivada`);
      if (activo) { await cargarInactivos(); } else { await cargarUsuarios(); }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cambiar estado");
    } finally { setAccionUsuario(null); }
  };

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
    } finally { setReactivando(null); }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const iniciales = (nombre) =>
    nombre?.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

  const formatFecha = (fecha) =>
    fecha ? new Date(fecha).toLocaleDateString("es-CL") : "-";

  const calcularDuracion = (inicio, fin) => {
    if (!inicio || !fin) return null;
    const dias = Math.floor((new Date(fin) - new Date(inicio)) / (1000 * 60 * 60 * 24));
    if (dias < 30) return `${dias} días`;
    const meses = Math.floor(dias / 30);
    return meses === 1 ? "1 mes" : `${meses} meses`;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">

        {/* Cabecera */}
        <div className="mb-6">
          <button onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" />Volver al panel
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-gray-500 text-sm mt-0.5">Verifica profesionales y administra cuentas</p>
            </div>
          </div>
        </div>

        {/* Pestañas */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit flex-wrap">
          {[
            { key: "usuarios",  label: "Usuarios" },
            { key: "inactivos", label: "Cuentas Inactivas" },
            { key: "pacientes", label: "Pacientes Eliminados" },
          ].map((p) => (
            <button key={p.key} onClick={() => setPestana(p.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pestana === p.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* ── USUARIOS ACTIVOS ── */}
        {pestana === "usuarios" && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
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

            {cargandoUsuarios ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonFila key={i} />)}</div>
            ) : usuarios.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-400">No hay usuarios con ese filtro</p>
              </div>
            ) : (
              <div className="space-y-3">
                {usuarios.map((u) => (
                  <div key={u._id} className="p-4 bg-white rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {iniciales(u.nombre)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">{u.nombre}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROL_COLOR[u.role]}`}>
                              {ROL_ETIQUETA[u.role]}
                            </span>
                            {u.role === "profesional" && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                u.verificado ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                              }`}>
                                {u.verificado ? "✓ Verificado" : "Pendiente"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {u.email}
                            {u.especialidad && <> · {ESPECIALIDAD_ETIQUETA[u.especialidad]}</>}
                            {" · "}Desde {formatFecha(u.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {u.role === "profesional" && (
                          <button onClick={() => handleVerificar(u, !u.verificado)}
                            disabled={accionUsuario === u._id}
                            title={u.verificado ? "Quitar verificación" : "Verificar profesional"}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                              u.verificado ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                            }`}>
                            <BadgeCheck className="h-4 w-4" />
                          </button>
                        )}
                        {u.role !== "admin" && (
                          <button onClick={() => setConfirmar({ tipo: "desactivar", item: u })}
                            disabled={accionUsuario === u._id}
                            title="Desactivar cuenta"
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                            <UserX className="h-4 w-4" />
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

        {/* ── CUENTAS INACTIVAS ── */}
        {pestana === "inactivos" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                {!cargandoInactivos && `${inactivos.length} cuentas inactivas`}
              </span>
              <button onClick={cargarInactivos} disabled={cargandoInactivos}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 ${cargandoInactivos ? "animate-spin" : ""}`} />
                Actualizar
              </button>
            </div>

            {cargandoInactivos ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonFila key={i} />)}</div>
            ) : inactivos.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">No hay cuentas inactivas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inactivos.map((u) => {
                  const fb = feedbacks[u._id];
                  const duracion = calcularDuracion(u.createdAt, u.fechaDesactivacion);
                  return (
                    <div key={u._id} className="p-4 bg-white rounded-xl border border-gray-200">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {iniciales(u.nombre)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-gray-900">{u.nombre}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROL_COLOR[u.role]}`}>
                                {ROL_ETIQUETA[u.role]}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
                                Inactiva
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {u.email}
                              {u.especialidad && <> · {ESPECIALIDAD_ETIQUETA[u.especialidad]}</>}
                            </p>

                            {/* Log de fechas y duración */}
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Calendar className="h-3 w-3" />
                                Alta: {formatFecha(u.createdAt)}
                              </span>
                              {u.fechaDesactivacion && (
                                <span className="flex items-center gap-1 text-xs text-red-400">
                                  <UserX className="h-3 w-3" />
                                  Baja: {formatFecha(u.fechaDesactivacion)}
                                </span>
                              )}
                              {duracion && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <Clock className="h-3 w-3" />
                                  Membresía: {duracion}
                                </span>
                              )}
                              {fb && (
                                <span className="flex items-center gap-1 text-xs text-orange-500">
                                  <MessageSquare className="h-3 w-3" />
                                  {MOTIVO_ETIQUETA[fb.motivoCese] || fb.motivoCese}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {fb && (
                            <button onClick={() => setModalFeedback(fb)}
                              title="Ver feedback de offboarding"
                              className="p-2 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors">
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => setConfirmar({ tipo: "activar", item: u })}
                            disabled={accionUsuario === u._id}
                            title="Reactivar cuenta"
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50">
                            <UserCheck className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── PACIENTES ELIMINADOS ── */}
        {pestana === "pacientes" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                {!cargandoPacientes && `${pacientesInactivos.length} pacientes eliminados`}
              </span>
              <button onClick={cargarPacientesInactivos} disabled={cargandoPacientes}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 ${cargandoPacientes ? "animate-spin" : ""}`} />
                Actualizar
              </button>
            </div>

            {cargandoPacientes ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonFila key={i} />)}</div>
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
                    <div key={p._id} className="p-4 bg-white rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {iniciales(`${p.nombre} ${p.apellido}`)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {p.nombre} {p.apellido}
                              <span className="ml-2 text-xs font-normal text-gray-400">{p.edad} años</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {creador && <>Creado por {creador.nombre} · </>}
                              {tutor?.nombre && <>Tutor: {tutor.nombre} · </>}
                              Eliminado {formatFecha(p.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => setConfirmar({ tipo: "reactivar", item: p })}
                          disabled={reactivando === p._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50">
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

      {/* ── Modal feedback offboarding ── */}
      {modalFeedback && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-orange-500" />
                <h3 className="text-base font-bold text-gray-900">Feedback de salida</h3>
              </div>
              <button onClick={() => setModalFeedback(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <span className="font-medium text-gray-900">
                  {modalFeedback.usuarioSnapshot?.nombre || modalFeedback.usuario?.nombre}
                </span>
                <span>·</span>
                <span>{modalFeedback.usuarioSnapshot?.email || modalFeedback.usuario?.email}</span>
                <span>·</span>
                <span>{formatFecha(modalFeedback.fechaCese)}</span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Motivo de cese</p>
                <p className="text-sm text-gray-800 font-medium">
                  {MOTIVO_ETIQUETA[modalFeedback.motivoCese] || modalFeedback.motivoCese}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">¿Recomendaría la plataforma?</p>
                <p className="text-sm text-gray-800 font-medium">
                  {RECOMIENDA_ETIQUETA[modalFeedback.recomendaria] || modalFeedback.recomendaria}
                </p>
              </div>
              {modalFeedback.sugerencias && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                    Sugerencias / qué le haría volver
                  </p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">
                    {modalFeedback.sugerencias}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmación ── */}
      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                confirmar.tipo === "desactivar" ? "bg-red-100" : "bg-blue-100"
              }`}>
                {confirmar.tipo === "desactivar" ? <UserX className="h-5 w-5 text-red-600" />
                  : confirmar.tipo === "reactivar" ? <RefreshCw className="h-5 w-5 text-blue-600" />
                  : <UserCheck className="h-5 w-5 text-blue-600" />}
              </div>
              <h3 className="text-base font-bold text-gray-900">
                {confirmar.tipo === "desactivar" && "¿Desactivar cuenta?"}
                {confirmar.tipo === "activar"    && "¿Reactivar cuenta?"}
                {confirmar.tipo === "reactivar"  && "¿Reactivar paciente?"}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              {confirmar.tipo === "desactivar" && <>La cuenta de <span className="font-semibold">{confirmar.item.nombre}</span> quedará bloqueada.</>}
              {confirmar.tipo === "activar"    && <>Se restaurará el acceso de <span className="font-semibold">{confirmar.item.nombre}</span>.</>}
              {confirmar.tipo === "reactivar"  && <>El paciente <span className="font-semibold">{confirmar.item.nombre} {confirmar.item.apellido}</span> volverá a estar visible.</>}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmar(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmar.tipo === "reactivar" ? handleReactivar : handleEstado}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${
                  confirmar.tipo === "desactivar" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                }`}>
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
