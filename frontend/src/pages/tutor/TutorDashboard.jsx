/**
 * Dashboard del Tutor
 * Vista principal para padres/tutores
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatsCard from "../../components/common/StatsCard";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import { obtenerMisPacientes } from "../../api/patients";
import { Users, Gamepad2, UserPlus, BookOpen, TrendingUp } from "lucide-react";

const TutorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pacientes: 0,
    juegosAsignados: 0,
  });
  const [pacientes, setPacientes] = useState([]);

  const cargarStats = useCallback(async () => {
    try {
      const resPacientes = await obtenerMisPacientes();
      const listaPacientes = resPacientes.data || [];
      setPacientes(listaPacientes);
      setStats({
        pacientes: listaPacientes.length,
        juegosAsignados: 0, // Se calculará en fase de progreso
      });
    } catch (err) {
      console.error("Error al cargar stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarStats();
  }, [cargarStats]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="h-28 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="h-28 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          ¡Hola, {user?.nombre}! 👋
        </h1>
        <p className="text-gray-600 mt-2">Bienvenido a tu dashboard familiar</p>
      </div>

      {/* Stats reales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatsCard
          title="Mis Hijos"
          value={stats.pacientes}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Juegos Asignados"
          value={stats.juegosAsignados}
          icon={Gamepad2}
          color="green"
        />
      </div>

      {/* Acciones principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Mis Hijos */}
        <Card title="Mis Hijos" subtitle="Administra los perfiles de tus hijos">
          <div className="space-y-4">
            {pacientes.length === 0 ? (
              <p className="text-gray-600 text-sm">
                Aún no has agregado ningún hijo. Comienza creando un perfil.
              </p>
            ) : (
              <p className="text-gray-600 text-sm">
                Tienes {pacientes.length}{" "}
                {pacientes.length === 1
                  ? "hijo registrado"
                  : "hijos registrados"}
                .
              </p>
            )}
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => navigate("/tutor/crear-paciente")}
                className="flex-1"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Agregar Hijo
              </Button>
              {pacientes.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/tutor/pacientes")}
                  className="flex-1"
                >
                  Ver Todos
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Biblioteca de Juegos */}
        <Card title="Biblioteca de Juegos" subtitle="Asigna juegos a tus hijos">
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Explora los juegos terapéuticos disponibles y asígnalos a tus
              hijos según sus necesidades
            </p>
            <Button
              variant="primary"
              onClick={() => navigate("/tutor/biblioteca")}
              className="w-full"
            >
              <Gamepad2 className="h-4 w-4 mr-2" />
              Ir a la Biblioteca
            </Button>
          </div>
        </Card>
      </div>

      {/* Hijos recientes */}
      {pacientes.length > 0 && (
        <Card className="mb-6" title="Mis Hijos">
          <div className="space-y-3">
            {pacientes.slice(0, 3).map((p) => (
              <div
                key={p._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => navigate(`/pacientes/${p._id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">
                      {p.nombre?.[0]}
                      {p.apellido?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {p.nombre} {p.apellido}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.edad} años
                      {p.diagnostico ? ` · ${p.diagnostico.slice(0, 30)}…` : ""}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-blue-600 font-medium">
                  Ver ficha →
                </span>
              </div>
            ))}
            {pacientes.length > 3 && (
              <button
                onClick={() => navigate("/tutor/pacientes")}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-1"
              >
                Ver todos ({pacientes.length})
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Guía rápida */}
      <Card title="Guía Rápida">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="text-center p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={() => navigate("/tutor/crear-paciente")}
          >
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              1. Crea un perfil
            </h3>
            <p className="text-sm text-gray-600">
              Agrega información de tu hijo/a
            </p>
          </div>

          <div
            className="text-center p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => navigate("/tutor/biblioteca")}
          >
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              2. Asigna juegos
            </h3>
            <p className="text-sm text-gray-600">
              Elige juegos apropiados para su edad
            </p>
          </div>

          <div
            className="text-center p-4 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
            onClick={() => navigate("/tutor/pacientes")}
          >
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              3. Monitorea progreso
            </h3>
            <p className="text-sm text-gray-600">
              Revisa la evolución de tu hijo/a
            </p>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default TutorDashboard;
