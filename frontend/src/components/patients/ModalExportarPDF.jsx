/**
 * ModalExportarPDF.jsx
 * Modal para exportar historial clínico en PDF.
 *
 * Tutor    → genera PDF amigable directamente
 * Profesional → muestra formulario de notas clínicas antes de exportar
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { obtenerEstadisticasPaciente, obtenerProgresoPaciente } from "../../api/progress";
import { generarPDFTutor, generarPDFProfesional } from "../../utils/generarPDF";
import { X, Download, FileText, Loader } from "lucide-react";

const ModalExportarPDF = ({ paciente, asignaciones, onClose }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [cargando, setCargando]     = useState(true);
  const [generando, setGenerando]   = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [historial, setHistorial]   = useState([]);

  // Notas clínicas — solo para profesional
  const [notas, setNotas] = useState({
    diagnosticoActualizado: "",
    objetivo:               "",
    observaciones:          "",
    recomendaciones:        "",
  });

  // ── Cargar datos de progreso al abrir ─────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        const [resStats, resHistorial] = await Promise.all([
          obtenerEstadisticasPaciente(paciente._id),
          obtenerProgresoPaciente(paciente._id, 20),
        ]);
        setEstadisticas(resStats.data);
        setHistorial(resHistorial.data || []);
      } catch {
        // Si falla, continúa sin datos de progreso
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [paciente._id]);

  const handleNotaChange = (e) => {
    setNotas({ ...notas, [e.target.name]: e.target.value });
  };

  const handleExportar = async () => {
    setGenerando(true);
    try {
      if (user?.role === "tutor") {
        generarPDFTutor({ paciente, asignaciones, estadisticas, historial });
      } else {
        generarPDFProfesional({
          paciente,
          asignaciones,
          estadisticas,
          historial,
          profesional: user,
          notas,
        });
      }
      toast.exito("PDF generado correctamente");
      onClose();
    } catch (err) {
      console.error("Error al generar PDF:", err);
      toast.error("Error al generar el PDF");
    } finally {
      setGenerando(false);
    }
  };

  const esTutor = user?.role === "tutor";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-gray-900">
              Exportar Informe PDF
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Info del paciente */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-700">
                {paciente.nombre?.[0]}{paciente.apellido?.[0]}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {paciente.nombre} {paciente.apellido}
              </p>
              <p className="text-xs text-gray-500">
                {paciente.edad} años · {paciente.tipoCuenta === "familiar" ? "Plan Familiar" : "Plan Profesional"}
              </p>
            </div>
          </div>

          {/* Tipo de informe */}
          <div className="p-3 rounded-xl border border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Tipo de informe
            </p>
            <div className={`flex items-center gap-2 text-sm font-medium ${esTutor ? "text-blue-700" : "text-green-700"}`}>
              <div className={`w-2 h-2 rounded-full ${esTutor ? "bg-blue-500" : "bg-green-500"}`} />
              {esTutor
                ? "Informe familiar — resumen amigable del progreso"
                : "Informe clínico profesional — técnico y detallado"}
            </div>
          </div>

          {/* Qué incluye */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Incluye
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span> Datos del paciente y áreas terapéuticas
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span>
                {esTutor ? "Resumen de actividad y puntajes" : "Diagnóstico y estadísticas de progreso"}
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span> Juegos asignados y estado
              </li>
              <li className="flex items-center gap-1.5">
                <span className={cargando ? "text-yellow-500" : "text-green-500"}>
                  {cargando ? "↻" : "✓"}
                </span>
                {cargando
                  ? "Cargando historial de sesiones..."
                  : `${historial.length} sesiones registradas`}
              </li>
              {!esTutor && (
                <li className="flex items-center gap-1.5">
                  <span className="text-green-500">✓</span> Tus notas clínicas (opcional)
                </li>
              )}
            </ul>
          </div>

          {/* Formulario de notas — solo profesional */}
          {!esTutor && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Notas clínicas <span className="normal-case text-gray-400">(opcionales — se incluyen en el PDF)</span>
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Diagnóstico actualizado
                </label>
                <textarea
                  name="diagnosticoActualizado"
                  value={notas.diagnosticoActualizado}
                  onChange={handleNotaChange}
                  rows={2}
                  placeholder="Ej: Trastorno del lenguaje expresivo leve, en proceso de mejora..."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Objetivo terapéutico actual
                </label>
                <textarea
                  name="objetivo"
                  value={notas.objetivo}
                  onChange={handleNotaChange}
                  rows={2}
                  placeholder="Ej: Mejorar la articulación del fonema /r/ en posición inicial..."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Observaciones clínicas
                </label>
                <textarea
                  name="observaciones"
                  value={notas.observaciones}
                  onChange={handleNotaChange}
                  rows={3}
                  placeholder="Observaciones sobre el desempeño, conducta, motivación..."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Recomendaciones
                </label>
                <textarea
                  name="recomendaciones"
                  value={notas.recomendaciones}
                  onChange={handleNotaChange}
                  rows={2}
                  placeholder="Recomendaciones para el hogar, próximos pasos terapéuticos..."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer — botones */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={generando}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleExportar}
            disabled={cargando || generando}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generando ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Descargar PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalExportarPDF;
