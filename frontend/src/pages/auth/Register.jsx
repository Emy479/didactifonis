/**
 * Página de Registro
 * Permite crear nuevas cuentas
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Card from "../../components/common/Card";
import Alert from "../../components/common/Alert";
import { Mail, Lock, User, Phone, Briefcase } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "tutor",
    telefono: "",
    especialidad: "",
    numeroRegistro: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const especialidades = [
    { value: "", label: "Selecciona una especialidad" },
    { value: "fonoaudiologia", label: "Fonoaudiología" },
    { value: "psicopedagogia", label: "Psicopedagogía" },
    { value: "educacion_especial", label: "Educación Especial" },
    { value: "terapia_lenguaje", label: "Terapia del Lenguaje" },
    { value: "audiologia", label: "Audiología" },
    { value: "neuropsicologia", label: "Neuropsicología" },
    { value: "psicologia", label: "Psicología" },
    { value: "otro", label: "Otro" },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validaciones generales
    if (!formData.nombre || !formData.email || !formData.password) {
      setError("Por favor completa todos los campos obligatorios");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    // Validaciones específicas para profesionales
    if (formData.role === "profesional") {
      if (!formData.especialidad) {
        setError("Por favor selecciona una especialidad");
        setLoading(false);
        return;
      }
      if (!formData.numeroRegistro.trim()) {
        setError("El número de registro profesional es obligatorio");
        setLoading(false);
        return;
      }
    }

    // Preparar datos
    const dataToSend = {
      nombre: formData.nombre,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      telefono: formData.telefono || undefined,
    };

    if (formData.role === "profesional") {
      dataToSend.especialidad = formData.especialidad;
      dataToSend.numeroRegistro = formData.numeroRegistro.trim();
    }

    const result = await register(dataToSend);

    if (result.success) {
      toast.exito("¡Cuenta creada exitosamente! Bienvenido/a 🎉");
      if (formData.role === "tutor") {
        navigate("/tutor/dashboard");
      } else if (formData.role === "profesional") {
        navigate("/profesional/dashboard");
      }
    } else {
      setError(result.error || "Error al crear la cuenta");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            🎓 Didactifonis
          </h1>
          <p className="text-blue-100 text-lg">Crea tu cuenta</p>
        </div>

        <Card>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Registro</h2>

          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError(null)}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selector de rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de cuenta <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      role: "tutor",
                      especialidad: "",
                      numeroRegistro: "",
                    })
                  }
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === "tutor"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="text-2xl mb-2">👨‍👩‍👧‍👦</div>
                  <div className="font-semibold">Tutor/Padre</div>
                  <div className="text-xs text-gray-600">Plan Familiar</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, role: "profesional" })
                  }
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === "profesional"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="text-2xl mb-2">👨‍⚕️</div>
                  <div className="font-semibold">Profesional</div>
                  <div className="text-xs text-gray-600">Plan Profesional</div>
                </button>
              </div>
            </div>

            {/* Nombre */}
            <Input
              label="Nombre completo"
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Juan Pérez"
              icon={<User className="h-5 w-5 text-gray-400" />}
              required
            />

            {/* Email */}
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              icon={<Mail className="h-5 w-5 text-gray-400" />}
              required
            />

            {/* Teléfono */}
            <Input
              label="Teléfono"
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="912345678"
              icon={<Phone className="h-5 w-5 text-gray-400" />}
            />

            {/* Campos profesional */}
            {formData.role === "profesional" && (
              <>
                {/* Especialidad */}
                <div>
                  <label
                    htmlFor="especialidad"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Especialidad <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="especialidad"
                      id="especialidad"
                      value={formData.especialidad}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    >
                      {especialidades.map((esp) => (
                        <option key={esp.value} value={esp.value}>
                          {esp.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Número de Registro — ahora con asterisco y nota de formato */}
                <div>
                  <Input
                    label="Número de Registro Profesional"
                    type="text"
                    name="numeroRegistro"
                    value={formData.numeroRegistro}
                    onChange={handleChange}
                    placeholder="Ej: 12345"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Ingresa el número de registro otorgado por tu colegio profesional
                  </p>
                </div>
              </>
            )}

            {/* Contraseña */}
            <Input
              label="Contraseña"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              icon={<Lock className="h-5 w-5 text-gray-400" />}
              required
            />

            {/* Confirmar contraseña */}
            <Input
              label="Confirmar contraseña"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              icon={<Lock className="h-5 w-5 text-gray-400" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                ¿Ya tienes cuenta?
              </span>
            </div>
          </div>

          <Link to="/login">
            <Button variant="outline" fullWidth>
              Iniciar Sesión
            </Button>
          </Link>
        </Card>

        <p className="text-center text-blue-100 text-sm mt-6">
          © 2026 Didactifonis. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default Register;
