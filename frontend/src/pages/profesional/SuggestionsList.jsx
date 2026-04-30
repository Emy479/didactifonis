import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import Alert from "../../components/common/Alert";
import api from "../../api/axios";
import { Lightbulb, ThumbsUp, ArrowLeft } from "lucide-react";

const SuggestionsList = () => {
  const navigate = useNavigate();
  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState("votos");

  const cargarSugerencias = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/suggestions?ordenar=${filtro}`);
      setSugerencias(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Error al cargar sugerencias");
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    cargarSugerencias();
  }, [cargarSugerencias]);

  const handleVotar = async (id) => {
    try {
      await api.post(`/suggestions/${id}/votar`);
      cargarSugerencias();
    } catch (err) {
      alert(err.response?.data?.error || "Error al votar");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sugerencias de la Comunidad
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {sugerencias.length} sugerencias activas
            </p>
          </div>

          <Button onClick={() => navigate("/profesional/sugerir-juego")}>
            <Lightbulb className="h-4 w-4 mr-2" />
            Nueva Sugerencia
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
          className="mb-6"
        />
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFiltro("votos")}
          className={`px-4 py-2 rounded-lg ${
            filtro === "votos"
              ? "bg-blue-500 text-white"
              : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border dark:border-gray-600"
          }`}
        >
          Más Votadas
        </button>
        <button
          onClick={() => setFiltro("recientes")}
          className={`px-4 py-2 rounded-lg ${
            filtro === "recientes"
              ? "bg-blue-500 text-white"
              : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border dark:border-gray-600"
          }`}
        >
          Recientes
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-4">
        {sugerencias.length === 0 ? (
          <Card className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay sugerencias aún</p>
            <p className="text-sm text-gray-500 mt-1">
              Sé el primero en sugerir un juego nuevo
            </p>
          </Card>
        ) : (
          sugerencias.map((sugerencia) => (
            <Card
              key={sugerencia._id}
              className="hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {sugerencia.titulo}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        sugerencia.estado === "pendiente"
                          ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400"
                          : sugerencia.estado === "aprobada"
                            ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                            : sugerencia.estado === "implementada"
                              ? "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {sugerencia.estado}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {sugerencia.descripcion.substring(0, 200)}
                    {sugerencia.descripcion.length > 200 && "..."}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="capitalize">
                      {sugerencia.areaTerapeutica}
                    </span>
                    <span>•</span>
                    <span>
                      Edades: {sugerencia.rangoEdadSugerido?.min}-
                      {sugerencia.rangoEdadSugerido?.max} años
                    </span>
                    <span>•</span>
                    <span>Por: {sugerencia.profesional?.nombre}</span>
                  </div>

                  {/* Feedback del admin */}
                  {sugerencia.notasAdmin && (
                    <div className="mt-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-0.5">
                        Feedback del administrador
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        {sugerencia.notasAdmin}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2 ml-4">
                  <button
                    onClick={() => handleVotar(sugerencia._id)}
                    className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <ThumbsUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-lg font-bold">
                      {sugerencia.votos}
                    </span>
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default SuggestionsList;
