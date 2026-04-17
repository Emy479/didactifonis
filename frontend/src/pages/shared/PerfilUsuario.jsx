/**
 * Página: Perfil de Usuario
 * Ver y editar datos personales + cambiar contraseña + desactivar cuenta
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../hooks/useAuth";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { getProfile, updateProfile, changePassword } from "../../api/auth";
import { desactivarCuenta } from "../../api/admin";
import { User, Lock, BadgeCheck, Phone, Stethoscope, AlertTriangle } from "lucide-react";

const ESPECIALIDADES = [
  { value: "fonoaudiologia", label: "Fonoaudiología" },
  { value: "psicopedagogia", label: "Psicopedagogía" },
  { value: "educacion_especial", label: "Educación Especial" },
  { value: "terapia_lenguaje", label: "Terapia del Lenguaje" },
  { value: "audiologia", label: "Audiología" },
  { value: "neuropsicologia", label: "Neuropsicología" },
  { value: "psicologia", label: "Psicología" },
  { value: "otro", label: "Otro" },
];

const ROL_ETIQUETA = {
  tutor: "Tutor / Familia",
  profesional: "Profesional",
  admin: "Administrador",
};

const MOTIVOS_CESE = [
  { value: "precio",       label: "El precio no se ajusta a mi presupuesto" },
  { value: "juegos",       label: "No encontré los juegos que necesitaba" },
  { value: "tecnico",      label: "Dificultades técnicas" },
  { value: "sin_necesidad",label: "Ya no necesito el servicio" },
  { value: "competencia",  label: "Me cambié a otra plataforma" },
  { value: "otro",         label: "Otro" },
];

const PerfilUsuario = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, updateUser, logout } = useAuth();

  const [loading, setLoading]                 = useState(true);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  const [perfil, setPerfil] = useState({ nombre: "", telefono: "", especialidad: "" });
  const [passwords, setPasswords] = useState({
    passwordActual: "", passwordNuevo: "", passwordConfirmar: "",
  });

  // Modal offboarding
  const [modalOffboarding, setModalOffboarding] = useState(false);
  const [pasoOffboarding, setPasoOffboarding]   = useState(1);
  const [desactivando, setDesactivando]         = useState(false);
  const [feedback, setFeedback] = useState({
    motivoCese: "", recomendaria: "", sugerencias: "",
  });

  // ── Cargar perfil ─────────────────────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await getProfile();
        const u = res.user;
        setPerfil({ nombre: u.nombre || "", telefono: u.telefono || "", especialidad: u.especialidad || "" });
      } catch (err) {
        toast.error(err.response?.data?.error || "Error al cargar el perfil");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [toast]);

  // ── Perfil ────────────────────────────────────────────────────────────────
  const handlePerfilChange = (e) => setPerfil({ ...perfil, [e.target.name]: e.target.value });

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    if (!perfil.nombre.trim()) { toast.advertencia("El nombre es obligatorio"); return; }
    setGuardandoPerfil(true);
    try {
      const payload = { nombre: perfil.nombre };
      if (perfil.telefono) payload.telefono = perfil.telefono;
      if (user?.role === "profesional" && perfil.especialidad) payload.especialidad = perfil.especialidad;
      const res = await updateProfile(payload);
      updateUser(res.user);
      toast.exito("¡Perfil actualizado correctamente!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al actualizar el perfil");
    } finally { setGuardandoPerfil(false); }
  };

  // ── Contraseña ────────────────────────────────────────────────────────────
  const handlePasswordChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (!passwords.passwordActual || !passwords.passwordNuevo || !passwords.passwordConfirmar) {
      toast.advertencia("Completa todos los campos de contraseña"); return;
    }
    if (passwords.passwordNuevo.length < 6) {
      toast.advertencia("La nueva contraseña debe tener al menos 6 caracteres"); return;
    }
    if (passwords.passwordNuevo !== passwords.passwordConfirmar) {
      toast.advertencia("Las contraseñas nuevas no coinciden"); return;
    }
    setGuardandoPassword(true);
    try {
      await changePassword({ passwordActual: passwords.passwordActual, passwordNuevo: passwords.passwordNuevo });
      toast.exito("¡Contraseña actualizada correctamente!");
      setPasswords({ passwordActual: "", passwordNuevo: "", passwordConfirmar: "" });
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cambiar la contraseña");
    } finally { setGuardandoPassword(false); }
  };

  // ── Offboarding ───────────────────────────────────────────────────────────
  const abrirModalOffboarding = () => {
    setPasoOffboarding(1);
    setFeedback({ motivoCese: "", recomendaria: "", sugerencias: "" });
    setModalOffboarding(true);
  };

  const cerrarModalOffboarding = () => { if (!desactivando) setModalOffboarding(false); };

  const handleFeedbackChange = (e) => setFeedback({ ...feedback, [e.target.name]: e.target.value });

  const handleSiguientePaso = () => {
    if (pasoOffboarding === 2) {
      if (!feedback.motivoCese)   { toast.advertencia("Por favor selecciona el motivo"); return; }
      if (!feedback.recomendaria) { toast.advertencia("Por favor indica si nos recomendarías"); return; }
    }
    setPasoOffboarding((p) => p + 1);
  };

  const handleDesactivarCuenta = async () => {
    setDesactivando(true);
    try {
      await desactivarCuenta(feedback);
      setModalOffboarding(false);
      toast.exito("Cuenta desactivada. ¡Gracias por tu feedback!");
      setTimeout(() => { logout(); navigate("/login"); }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al desactivar la cuenta");
    } finally { setDesactivando(false); }
  };

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-52 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3.5 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            ))}
            <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3.5 w-28 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            ))}
            <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
            <p className="text-gray-500 text-sm mt-0.5">Administra tu información personal</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Stethoscope className="h-3.5 w-3.5" />
            {ROL_ETIQUETA[user?.role] || user?.role}
          </span>
          {user?.role === "profesional" && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              user?.verificado ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            }`}>
              <BadgeCheck className="h-3.5 w-3.5" />
              {user?.verificado ? "Verificado" : "Pendiente de verificación"}
            </span>
          )}
        </div>

        {/* ── Sección 1: Datos personales ───────────────────────────────── */}
        <Card>
          <form onSubmit={handleGuardarPerfil} className="space-y-5">
            <h3 className="text-base font-semibold text-gray-900">Datos Personales</h3>
            <Input label="Nombre completo" name="nombre" value={perfil.nombre} onChange={handlePerfilChange} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                {user?.email}
              </div>
              <p className="text-xs text-gray-400 mt-1">El email no puede modificarse</p>
            </div>
            <Input label="Teléfono (opcional)" name="telefono" type="tel" value={perfil.telefono} onChange={handlePerfilChange} placeholder="912345678" />
            {user?.role === "profesional" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                <select name="especialidad" value={perfil.especialidad} onChange={handlePerfilChange}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="">Selecciona una especialidad</option>
                  {ESPECIALIDADES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
            )}
            <Button type="submit" variant="primary" fullWidth loading={guardandoPerfil} disabled={guardandoPerfil}>
              {guardandoPerfil ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </form>
        </Card>

        {/* ── Sección 2: Cambiar contraseña ─────────────────────────────── */}
        <Card>
          <form onSubmit={handleCambiarPassword} className="space-y-5">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900">Cambiar Contraseña</h3>
            </div>
            <Input label="Contraseña actual" name="passwordActual" type="password" value={passwords.passwordActual} onChange={handlePasswordChange} placeholder="Tu contraseña actual" />
            <Input label="Nueva contraseña" name="passwordNuevo" type="password" value={passwords.passwordNuevo} onChange={handlePasswordChange} placeholder="Mínimo 6 caracteres" />
            <div>
              <Input label="Confirmar nueva contraseña" name="passwordConfirmar" type="password" value={passwords.passwordConfirmar} onChange={handlePasswordChange} placeholder="Repite la nueva contraseña" />
              {passwords.passwordNuevo && passwords.passwordConfirmar && (
                <p className={`text-xs mt-1 ${passwords.passwordNuevo === passwords.passwordConfirmar ? "text-green-600" : "text-red-500"}`}>
                  {passwords.passwordNuevo === passwords.passwordConfirmar ? "✓ Las contraseñas coinciden" : "✗ Las contraseñas no coinciden"}
                </p>
              )}
            </div>
            <Button type="submit" variant="outline" fullWidth loading={guardandoPassword} disabled={guardandoPassword}>
              {guardandoPassword ? "Actualizando..." : "Actualizar Contraseña"}
            </Button>
          </form>
        </Card>

        {/* ── Sección 3: Zona de peligro ────────────────────────────────── */}
        {user?.role !== "admin" && (
          <Card>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Desactivar cuenta</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Tu cuenta quedará suspendida y no podrás iniciar sesión.
                  Tu historial y datos se conservan — podés reactivarla contactando al soporte.
                </p>
                <button type="button" onClick={abrirModalOffboarding}
                  className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline transition-colors">
                  Quiero desactivar mi cuenta
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* ── Modal offboarding ─────────────────────────────────────────────── */}
      {modalOffboarding && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl">

            {/* Barra de progreso */}
            <div className="flex gap-1 px-6 pt-5">
              {[1, 2, 3].map((p) => (
                <div key={p} className={`h-1 flex-1 rounded-full transition-colors ${p <= pasoOffboarding ? "bg-red-500" : "bg-gray-200"}`} />
              ))}
            </div>

            <div className="p-6">

              {/* Paso 1 — Advertencia */}
              {pasoOffboarding === 1 && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">¿Desactivar tu cuenta?</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Antes de continuar, tené en cuenta:</p>
                  <ul className="text-sm text-gray-600 space-y-2 mb-6">
                    <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span>No podrás iniciar sesión mientras la cuenta esté desactivada</li>
                    <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span>Tu historial y datos se conservan íntegramente</li>
                    <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span>Podés reactivar tu cuenta contactando al soporte</li>
                    {user?.role === "profesional" && (
                      <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span>Tus pacientes activos no podrán ser atendidos hasta que reactives</li>
                    )}
                  </ul>
                  <div className="flex gap-3">
                    <button onClick={cerrarModalOffboarding} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Cancelar</button>
                    <button onClick={handleSiguientePaso} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors">Continuar</button>
                  </div>
                </>
              )}

              {/* Paso 2 — Cuestionario */}
              {pasoOffboarding === 2 && (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Antes de irte...</h3>
                  <p className="text-sm text-gray-500 mb-5">Tu opinión nos ayuda a mejorar. Solo toma un momento.</p>

                  {/* Pregunta 1 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Por qué dejás la plataforma? <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {MOTIVOS_CESE.map((m) => (
                        <label key={m.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          feedback.motivoCese === m.value ? "border-red-400 bg-red-50" : "border-gray-200 hover:bg-gray-50"
                        }`}>
                          <input type="radio" name="motivoCese" value={m.value} checked={feedback.motivoCese === m.value} onChange={handleFeedbackChange} className="text-red-500" />
                          <span className="text-sm text-gray-700">{m.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Pregunta 2 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Nos recomendarías a un colega? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {[{ value: "si", label: "👍 Sí" }, { value: "tal_vez", label: "🤔 Tal vez" }, { value: "no", label: "👎 No" }].map((op) => (
                        <button key={op.value} type="button"
                          onClick={() => setFeedback({ ...feedback, recomendaria: op.value })}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                            feedback.recomendaria === op.value ? "border-red-400 bg-red-50 text-red-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}>
                          {op.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pregunta 3 — opcional */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ¿Qué te haría volver o qué te gustaría ver?{" "}
                      <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <textarea name="sugerencias" value={feedback.sugerencias} onChange={handleFeedbackChange}
                      rows={3} maxLength={1000} placeholder="Tu opinión es muy valiosa para nosotros..."
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                    <p className="text-xs text-gray-400 mt-1 text-right">{feedback.sugerencias.length}/1000</p>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setPasoOffboarding(1)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Atrás</button>
                    <button onClick={handleSiguientePaso} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors">Continuar</button>
                  </div>
                </>
              )}

              {/* Paso 3 — Confirmación final */}
              {pasoOffboarding === 3 && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AlertTriangle className="h-7 w-7 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmación final</h3>
                    <p className="text-sm text-gray-600">
                      Estás a punto de desactivar la cuenta de{" "}
                      <span className="font-semibold">{user?.nombre}</span>.
                      Esta acción cerrará tu sesión inmediatamente.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setPasoOffboarding(2)} disabled={desactivando}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50">
                      Atrás
                    </button>
                    <button onClick={handleDesactivarCuenta} disabled={desactivando}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                      {desactivando ? "Desactivando..." : "Sí, desactivar"}
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PerfilUsuario;
