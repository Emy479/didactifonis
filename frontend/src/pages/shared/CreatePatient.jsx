/**
 * Página: Crear Paciente
 * Formulario para crear paciente (Tutor o Profesional)
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import { crearPaciente } from "../../api/patients";
import { UserPlus, ArrowLeft, Calendar, FileText } from "lucide-react";

const CreatePatient = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    fechaNacimiento: "",
    diagnostico: "",
    notas: "",
    tutorInfo: {
      nombre: "",
      email: "",
      telefono: "",
    },
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTutorInfoChange = (e) => {
    setFormData({
      ...formData,
      tutorInfo: {
        ...formData.tutorInfo,
        [e.target.name]: e.target.value,
      },
    });
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return "";
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!formData.nombre || !formData.fechaNacimiento) {
        setError("Por favor completa los campos obligatorios");
        setLoading(false);
        return;
      }

      const edad = calcularEdad(formData.fechaNacimiento);
      if (edad < 2 || edad > 18) {
        setError("La edad debe estar entre 2 y 18 años");
        setLoading(false);
        return;
      }

      if (user.role === "profesional") {
        if (!formData.tutorInfo.nombre || !formData.tutorInfo.email) {
          setError("Por favor completa la información del tutor");
          setLoading(false);
          return;
        }
      }

      const dataToSend = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        fechaNacimiento: formData.fechaNacimiento,
        diagnostico: formData.diagnostico || undefined,
        notas: formData.notas || undefined,
        creadoPor: user.userId,
      };

      if (user.role === "profesional") {
        dataToSend.tutorInfo = {
          nombre: formData.tutorInfo.nombre,
          email: formData.tutorInfo.email,
          telefono: formData.tutorInfo.telefono || undefined,
        };
      }

      await crearPaciente(dataToSend);
      setSuccess(true);

      setTimeout(() => {
        if (user.role === "tutor") {
          navigate("/tutor/pacientes");
        } else {
          navigate("/profesional/pacientes");
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Error al crear paciente");
    } finally {
      setLoading(false);
    }
  };

  const edad = calcularEdad(formData.fechaNacimiento);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user.role === "tutor" ? "Agregar Hijo/a" : "Nuevo Paciente"}
            </h1>
            <p className="text-gray-600 mt-1">
              {user.role === "tutor"
                ? "Crea un perfil para tu hijo/a"
                : "Registra un nuevo paciente en tu consulta"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
          className="mb-6"
        />
      )}

      {success && (
        <Alert
          type="success"
          message="¡Paciente creado exitosamente! Redirigiendo..."
          className="mb-6"
        />
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información del {user.role === "tutor" ? "Niño/a" : "Paciente"}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Mateo"
                  required
                />

                <Input
                  label="Apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  placeholder="Ej: González"
                  required
                />
              </div>

              <div>
                <Input
                  label="Fecha de Nacimiento"
                  type="date"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  icon={<Calendar className="h-5 w-5 text-gray-400" />}
                  required
                />
                {edad && (
                  <p className="text-sm text-gray-600 mt-1">
                    Edad actual: {edad} años
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnóstico {user.role === "tutor" && "(opcional)"}
                </label>
                <textarea
                  name="diagnostico"
                  value={formData.diagnostico}
                  onChange={handleChange}
                  rows="3"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Trastorno del lenguaje expresivo, dislalia..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows="3"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Información relevante, alergias, preferencias..."
                />
              </div>
            </div>
          </div>

          {user.role === "profesional" && (
            <>
              <hr className="my-6" />

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Información del Tutor/Padre
                </h3>

                <div className="space-y-4">
                  <Input
                    label="Nombre del tutor"
                    name="nombre"
                    value={formData.tutorInfo.nombre}
                    onChange={handleTutorInfoChange}
                    placeholder="Ej: María González"
                    required
                  />

                  <Input
                    label="Email del tutor"
                    type="email"
                    name="email"
                    value={formData.tutorInfo.email}
                    onChange={handleTutorInfoChange}
                    placeholder="maria@ejemplo.com"
                    required
                  />

                  <Input
                    label="Teléfono del tutor"
                    type="tel"
                    name="telefono"
                    value={formData.tutorInfo.telefono}
                    onChange={handleTutorInfoChange}
                    placeholder="912345678"
                  />

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">Nota importante:</p>
                        <p>
                          Si el tutor no tiene cuenta, se creará
                          automáticamente. Recibirá un enlace para activar su
                          cuenta.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading || success}
            >
              {loading ? "Creando..." : "Crear Paciente"}
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </DashboardLayout>
  );
};

export default CreatePatient;
