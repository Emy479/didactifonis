/**
 * Página: Editar Paciente
 * Formulario para editar datos de un paciente existente
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { obtenerPaciente, actualizarPaciente } from "../../api/patients";
import { UserCog, ArrowLeft } from "lucide-react";

const AREAS_OPCIONES = [
  { value: "fonologia", label: "Fonología" },
  { value: "semantica", label: "Semántica" },
  { value: "morfosintaxis", label: "Morfosintaxis" },
  { value: "pragmatica", label: "Pragmática" },
  { value: "habla", label: "Habla" },
  { value: "lenguaje", label: "Lenguaje" },
];

const EditPatient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    fechaNacimiento: "",
    genero: "prefiero_no_decir",
    diagnostico: "",
    observaciones: "",
    areasTrabajar: [],
  });

  // ── Cargar datos actuales del paciente ────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await obtenerPaciente(id);
        const p = res.data;

        const fecha = p.fechaNacimiento
          ? new Date(p.fechaNacimiento).toISOString().split("T")[0]
          : "";

        setFormData({
          nombre: p.nombre || "",
          apellido: p.apellido || "",
          fechaNacimiento: fecha,
          genero: p.genero || "prefiero_no_decir",
          diagnostico: p.diagnostico || "",
          observaciones: p.observaciones || "",
          areasTrabajar: p.areasTrabajar || [],
        });
      } catch (err) {
        toast.error(err.response?.data?.error || "Error al cargar paciente");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id, toast]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleArea = (area) => {
    setFormData((prev) => ({
      ...prev,
      areasTrabajar: prev.areasTrabajar.includes(area)
        ? prev.areasTrabajar.filter((a) => a !== area)
        : [...prev.areasTrabajar, area],
    }));
  };

  const calcularEdad = (fecha) => {
    if (!fecha) return "";
    const hoy = new Date();
    const nac = new Date(fecha);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  // ── Guardar ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (!formData.nombre || !formData.fechaNacimiento) {
        toast.advertencia("Nombre y fecha de nacimiento son obligatorios");
        setGuardando(false);
        return;
      }

      await actualizarPaciente(id, {
        nombre: formData.nombre,
        apellido: formData.apellido,
        fechaNacimiento: formData.fechaNacimiento,
        genero: formData.genero,
        diagnostico: formData.diagnostico || undefined,
        observaciones: formData.observaciones || undefined,
        areasTrabajar: formData.areasTrabajar,
      });

      toast.exito("¡Paciente actualizado correctamente!");
      navigate(`/pacientes/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al actualizar paciente");
    } finally {
      setGuardando(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          {/* Cabecera skeleton */}
          <div className="mb-6">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-56 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Card skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            {/* Sección datos básicos */}
            <div>
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-4">
                {/* Nombre / Apellido */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                  </div>
                </div>
                {/* Fecha */}
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                </div>
                {/* Género */}
                <div className="space-y-1.5">
                  <div className="h-3.5 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Sección clínica */}
            <div>
              <div className="h-4 w-36 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-4">
                {/* Diagnóstico */}
                <div className="space-y-1.5">
                  <div className="h-3.5 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
                </div>
                {/* Observaciones */}
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 bg-gray-200 rounded animate-pulse" />
                  <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
                </div>
                {/* Áreas */}
                <div className="space-y-2">
                  <div className="h-3.5 w-28 bg-gray-200 rounded animate-pulse" />
                  <div className="flex gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-7 w-20 bg-gray-200 rounded-full animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-2">
              <div className="h-10 flex-1 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-10 flex-1 bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const edad = calcularEdad(formData.fechaNacimiento);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Cabecera */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/pacientes/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver al detalle
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <UserCog className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Editar Paciente
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Actualiza la información clínica
              </p>
            </div>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datos básicos */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Datos Básicos
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Input
                    label="Fecha de Nacimiento"
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                    required
                  />
                  {edad && (
                    <p className="text-sm text-gray-500 mt-1">
                      Edad actual: {edad} años
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Género
                  </label>
                  <select
                    name="genero"
                    value={formData.genero}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                    <option value="prefiero_no_decir">Prefiero no decir</option>
                  </select>
                </div>
              </div>
            </div>

            <hr />

            {/* Información clínica */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Información Clínica
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnóstico
                  </label>
                  <textarea
                    name="diagnostico"
                    value={formData.diagnostico}
                    onChange={handleChange}
                    rows="3"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Ej: Trastorno del lenguaje expresivo..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    rows="3"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Notas adicionales, preferencias, alergias..."
                  />
                </div>

                {/* Áreas de trabajo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Áreas de Trabajo
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AREAS_OPCIONES.map((area) => {
                      const activa = formData.areasTrabajar.includes(
                        area.value,
                      );
                      return (
                        <button
                          key={area.value}
                          type="button"
                          onClick={() => toggleArea(area.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            activa
                              ? "bg-purple-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {area.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={guardando}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar Cambios"}
              </Button>
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => navigate(`/pacientes/${id}`)}
                disabled={guardando}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EditPatient;
