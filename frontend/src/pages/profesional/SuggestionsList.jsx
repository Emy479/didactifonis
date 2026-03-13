import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import Alert from "../../components/common/Alert";
import api from "../../api/axios";
import { Lightbulb, ThumbsUp, ArrowLeft, Filter } from "lucide-react";

const SuggestionsList = () => {
  const navigate = useNavigate();
  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState("votos");

  useEffect(() => {
    cargarSugerencias();
  }, [filtro]);

  const cargarSugerencias = async () => {
    try {
      const response = await api.get(`/suggestions?ordenar=${filtro}`);
      setSugerencias(response.data.data);
    } catch (err) {
      setError("Error al cargar sugerencias");
    } finally {
      setLoading(false);
    }
  };

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
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Sugerencias de la Comunidad
            </h1>
            <p className="text-gray-600 mt-1">
              {sugerencias.length} sugerencias activas
            </p>
          </div>

          <Button onClick={() => navigate("/profesional/sugerir-juego")}>
            <Lightbulb className="h-4 w-4 mr-2" />
            Nueva Sugerencia
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFiltro("votos")}
          className={`px-4 py-2 rounded-lg ${
            filtro === "votos"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 border"
          }`}
        >
          Más Votadas
        </button>
        <button
          onClick={() => setFiltro("recientes")}
          className={`px-4 py-2 rounded-lg ${
            filtro === "recientes"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 border"
          }`}
        >
          Recientes
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-4">
        {sugerencias.map((sugerencia) => (
          <Card
            key={sugerencia._id}
            className="hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {sugerencia.titulo}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      sugerencia.estado === "pendiente"
                        ? "bg-yellow-100 text-yellow-800"
                        : sugerencia.estado === "aprobada"
                          ? "bg-green-100 text-green-800"
                          : sugerencia.estado === "implementada"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {sugerencia.estado}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  {sugerencia.descripcion.substring(0, 200)}...
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
              </div>

              <div className="flex flex-col items-center gap-2 ml-4">
                <button
                  onClick={() => handleVotar(sugerencia._id)}
                  className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 rounded-lg"
                  disabled={sugerencia.votadoPor?.includes(sugerencia._id)}
                >
                  <ThumbsUp className="h-5 w-5 text-gray-600" />
                  <span className="text-lg font-bold">{sugerencia.votos}</span>
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default SuggestionsList;
