/**
 * Dashboard del Tutor
 * Vista principal para padres/tutores
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatsCard from "../../components/common/StatsCard";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Spinner from "../../components/common/Spinner";
import { Users, Gamepad2, TrendingUp, UserPlus } from "lucide-react";

const TutorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pacientes: 0,
    profesionales: 0,
    sesionesHoy: 0,
  });

  useEffect(() => {
    // Simular carga de datos
    // TODO: Reemplazar con llamadas reales a la API
    setTimeout(() => {
      setStats({
        pacientes: 2,
        profesionales: 1,
        sesionesHoy: 3,
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          ¡Hola, {user?.nombre}! 👋
        </h1>
        <p className="text-gray-600 mt-2">Bienvenido a tu dashboard familiar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Mis Hijos"
          value={stats.pacientes}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Profesionales Asignados"
          value={stats.profesionales}
          icon={UserPlus}
          color="green"
        />
        <StatsCard
          title="Sesiones Hoy"
          value={stats.sesionesHoy}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Acción rápida */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mis Pacientes */}
        <Card title="Mis Hijos" subtitle="Administra a tus hijos">
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Aún no has agregado ningún hijo. Comienza creando un perfil para
              tu hijo/a.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate("/tutor/crear-paciente")}
              className="w-full"
            >
              + Agregar Hijo
            </Button>
          </div>
        </Card>

        {/* Juegos Disponibles */}
        <Card title="Juegos Disponibles" subtitle="Explora nuestro catálogo">
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Descubre juegos educativos para tus hijos
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/tutor/juegos")}
              className="w-full"
            >
              <Gamepad2 className="h-4 w-4 mr-2" />
              Ver Juegos
            </Button>
          </div>
        </Card>
      </div>

      {/* Guía rápida */}
      <Card className="mt-6" title="Guía Rápida">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-gray-900">
                Crea un perfil para tu hijo/a
              </p>
              <p className="text-sm text-gray-600">
                Agrega información básica y edad
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-gray-900">
                Asigna un profesional (opcional)
              </p>
              <p className="text-sm text-gray-600">
                Conecta con un fonoaudiólogo verificado
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-gray-900">Selecciona juegos</p>
              <p className="text-sm text-gray-600">
                Elige juegos apropiados para la edad de tu hijo/a
              </p>
            </div>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default TutorDashboard;
