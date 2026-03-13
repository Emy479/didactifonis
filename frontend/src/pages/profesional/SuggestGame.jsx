/**
 * Página: Sugerir Juego Nuevo
 * Formulario para que profesionales sugieran juegos
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import api from "../../api/axios";
import { Lightbulb, ArrowLeft } from "lucide-react";

const SuggestGame = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    areaTerapeutica: "fonologia",
    rangoEdadSugerido: {
      min: 4,
      max: 8,
    },
    objetivos: [""],
  });

  const areas = [
    { value: "fonologia", label: "Fonología" },
    { value: "semantica", label: "Semántica" },
    { value: "sintaxis", label: "Sintaxis" },
    { value: "pragmatica", label: "Pragmática" },
    { value: "habla", label: "Habla" },
    { value: "lenguaje", label: "Lenguaje" },
    { value: "general", label: "General" },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRangoChange = (e) => {
    setFormData({
      ...formData,
      rangoEdadSugerido: {
        ...formData.rangoEdadSugerido,
        [e.target.name]: parseInt(e.target.value),
      },
    });
  };

  const handleObjetivoChange = (index, value) => {
    const nuevosObjetivos = [...formData.objetivos];
    nuevosObjetivos[index] = value;
    setFormData({
      ...formData,
      objetivos: nuevosObjetivos,
    });
  };

  const agregarObjetivo = () => {
    setFormData({
      ...formData,
      objetivos: [...formData.objetivos, ""],
    });
  };

  const eliminarObjetivo = (index) => {
    const nuevosObjetivos = formData.objetivos.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      objetivos: nuevosObjetivos.length > 0 ? nuevosObjetivos : [""],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Filtrar objetivos vacíos
    const objetivosFiltrados = formData.objetivos.filter(
      (obj) => obj.trim() !== "",
    );

    try {
      await api.post("/suggestions", {
        ...formData,
        objetivos: objetivosFiltrados,
      });

      setSuccess(true);

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate("/profesional/sugerencias");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Error al enviar sugerencia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
            <Lightbulb className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Sugerir Juego Nuevo
            </h1>
            <p className="text-gray-600 mt-1">
              Ayúdanos a mejorar la plataforma con tus ideas
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
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
          message="¡Sugerencia enviada exitosamente! Redirigiendo..."
          className="mb-6"
        />
      )}

      {/* Formulario */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <Input
            label="Título del Juego"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            placeholder="Ej: Ejercicio de Fonema /RR/"
            required
          />

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows="5"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe detalladamente cómo funcionaría el juego, qué actividades incluiría, y qué beneficios terapéuticos tendría..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.descripcion.length}/1000 caracteres
            </p>
          </div>

          {/* Área Terapéutica */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Área Terapéutica <span className="text-red-500">*</span>
            </label>
            <select
              name="areaTerapeutica"
              value={formData.areaTerapeutica}
              onChange={handleChange}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {areas.map((area) => (
                <option key={area.value} value={area.value}>
                  {area.label}
                </option>
              ))}
            </select>
          </div>

          {/* Rango de Edad */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Edad Mínima"
              type="number"
              name="min"
              value={formData.rangoEdadSugerido.min}
              onChange={handleRangoChange}
              min="2"
              max="18"
            />
            <Input
              label="Edad Máxima"
              type="number"
              name="max"
              value={formData.rangoEdadSugerido.max}
              onChange={handleRangoChange}
              min="2"
              max="18"
            />
          </div>

          {/* Objetivos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objetivos Terapéuticos
            </label>
            {formData.objetivos.map((objetivo, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={objetivo}
                  onChange={(e) => handleObjetivoChange(index, e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Mejorar pronunciación del fonema /RR/"
                />
                {formData.objetivos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => eliminarObjetivo(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={agregarObjetivo}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Agregar objetivo
            </button>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading || success}
            >
              {loading ? "Enviando..." : "Enviar Sugerencia"}
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

      {/* Info adicional */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">
          💡 Consejos para una buena sugerencia:
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Sé específico en la descripción del juego</li>
          <li>• Explica claramente los objetivos terapéuticos</li>
          <li>• Indica el rango de edad apropiado</li>
          <li>• Describe las mecánicas de juego si es posible</li>
        </ul>
      </Card>
    </DashboardLayout>
  );
};

export default SuggestGame;
