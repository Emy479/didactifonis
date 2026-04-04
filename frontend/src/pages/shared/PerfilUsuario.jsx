/**
 * Página: Perfil de Usuario
 * Ver y editar datos personales + cambiar contraseña
 */

import { useState, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../hooks/useAuth";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { getProfile, updateProfile, changePassword } from "../../api/auth";
import { User, Lock, BadgeCheck, Phone, Stethoscope } from "lucide-react";

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

const PerfilUsuario = () => {
  const toast = useToast();
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  const [perfil, setPerfil] = useState({
    nombre: "",
    telefono: "",
    especialidad: "",
  });

  const [passwords, setPasswords] = useState({
    passwordActual: "",
    passwordNuevo: "",
    passwordConfirmar: "",
  });

  // ── Cargar perfil ─────────────────────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await getProfile();
        const u = res.user;
        setPerfil({
          nombre: u.nombre || "",
          telefono: u.telefono || "",
          especialidad: u.especialidad || "",
        });
      } catch (err) {
        toast.error(err.response?.data?.error || "Error al cargar el perfil");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [toast]);

  // ── Handlers perfil ───────────────────────────────────────────────────────
  const handlePerfilChange = (e) => {
    setPerfil({ ...perfil, [e.target.name]: e.target.value });
  };

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();

    if (!perfil.nombre.trim()) {
      toast.advertencia("El nombre es obligatorio");
      return;
    }

    setGuardandoPerfil(true);
    try {
      const payload = { nombre: perfil.nombre };
      if (perfil.telefono) payload.telefono = perfil.telefono;
      if (user?.role === "profesional" && perfil.especialidad)
        payload.especialidad = perfil.especialidad;

      const res = await updateProfile(payload);

      // Actualizar contexto para que el Navbar refleje el nuevo nombre
      updateUser(res.user);

      toast.exito("¡Perfil actualizado correctamente!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al actualizar el perfil");
    } finally {
      setGuardandoPerfil(false);
    }
  };

  // ── Handlers contraseña ───────────────────────────────────────────────────
  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();

    if (!passwords.passwordActual || !passwords.passwordNuevo || !passwords.passwordConfirmar) {
      toast.advertencia("Completa todos los campos de contraseña");
      return;
    }

    if (passwords.passwordNuevo.length < 6) {
      toast.advertencia("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (passwords.passwordNuevo !== passwords.passwordConfirmar) {
      toast.advertencia("Las contraseñas nuevas no coinciden");
      return;
    }

    setGuardandoPassword(true);
    try {
      await changePassword({
        passwordActual: passwords.passwordActual,
        passwordNuevo: passwords.passwordNuevo,
      });

      toast.exito("¡Contraseña actualizada correctamente!");
      setPasswords({ passwordActual: "", passwordNuevo: "", passwordConfirmar: "" });
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cambiar la contraseña");
    } finally {
      setGuardandoPassword(false);
    }
  };

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Cabecera skeleton */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-52 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Card perfil skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="h-3.5 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3.5 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3.5 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
          </div>

          {/* Card password skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3.5 w-28 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
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
            <p className="text-gray-500 text-sm mt-0.5">
              Administra tu información personal
            </p>
          </div>
        </div>

        {/* Badge de rol + verificación */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Stethoscope className="h-3.5 w-3.5" />
            {ROL_ETIQUETA[user?.role] || user?.role}
          </span>

          {user?.role === "profesional" && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                user?.verificado
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              <BadgeCheck className="h-3.5 w-3.5" />
              {user?.verificado ? "Verificado" : "Pendiente de verificación"}
            </span>
          )}
        </div>

        {/* ── Sección 1: Datos personales ─────────────────────────────────── */}
        <Card>
          <form onSubmit={handleGuardarPerfil} className="space-y-5">
            <h3 className="text-base font-semibold text-gray-900">
              Datos Personales
            </h3>

            <Input
              label="Nombre completo"
              name="nombre"
              value={perfil.nombre}
              onChange={handlePerfilChange}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                {user?.email}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                El email no puede modificarse
              </p>
            </div>

            <Input
              label="Teléfono (opcional)"
              name="telefono"
              type="tel"
              value={perfil.telefono}
              onChange={handlePerfilChange}
              placeholder="912345678"
            />

            {user?.role === "profesional" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidad
                </label>
                <select
                  name="especialidad"
                  value={perfil.especialidad}
                  onChange={handlePerfilChange}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Selecciona una especialidad</option>
                  {ESPECIALIDADES.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={guardandoPerfil}
              disabled={guardandoPerfil}
            >
              {guardandoPerfil ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </form>
        </Card>

        {/* ── Sección 2: Cambiar contraseña ───────────────────────────────── */}
        <Card>
          <form onSubmit={handleCambiarPassword} className="space-y-5">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900">
                Cambiar Contraseña
              </h3>
            </div>

            <Input
              label="Contraseña actual"
              name="passwordActual"
              type="password"
              value={passwords.passwordActual}
              onChange={handlePasswordChange}
              placeholder="Tu contraseña actual"
            />

            <Input
              label="Nueva contraseña"
              name="passwordNuevo"
              type="password"
              value={passwords.passwordNuevo}
              onChange={handlePasswordChange}
              placeholder="Mínimo 6 caracteres"
            />

            <div>
              <Input
                label="Confirmar nueva contraseña"
                name="passwordConfirmar"
                type="password"
                value={passwords.passwordConfirmar}
                onChange={handlePasswordChange}
                placeholder="Repite la nueva contraseña"
              />
              {/* Indicador visual de coincidencia */}
              {passwords.passwordNuevo && passwords.passwordConfirmar && (
                <p
                  className={`text-xs mt-1 ${
                    passwords.passwordNuevo === passwords.passwordConfirmar
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {passwords.passwordNuevo === passwords.passwordConfirmar
                    ? "✓ Las contraseñas coinciden"
                    : "✗ Las contraseñas no coinciden"}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="outline"
              fullWidth
              loading={guardandoPassword}
              disabled={guardandoPassword}
            >
              {guardandoPassword ? "Actualizando..." : "Actualizar Contraseña"}
            </Button>
          </form>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default PerfilUsuario;
