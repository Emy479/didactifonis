/**
 * Dashboard del Profesional
 * Vista principal para fonoaudiólogos
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatsCard from '../../components/common/StatsCard';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import { Users, Gamepad2, Activity, UserPlus } from 'lucide-react';

const ProfesionalDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pacientes: 0,
    juegos: 0,
    sesionesHoy: 0,
  });

  useEffect(() => {
    // Simular carga de datos
    // TODO: Reemplazar con llamadas reales a la API
    setTimeout(() => {
      setStats({
        pacientes: 5,
        juegos: 3,
        sesionesHoy: 8,
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
          ¡Hola, {user?.nombre}! 👨‍⚕️
        </h1>
        <p className="text-gray-600 mt-2">
          Bienvenido a tu dashboard profesional
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Pacientes Activos"
          value={stats.pacientes}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Juegos Creados"
          value={stats.juegos}
          icon={Gamepad2}
          color="green"
        />
        <StatsCard
          title="Sesiones Hoy"
          value={stats.sesionesHoy}
          icon={Activity}
          color="purple"
        />
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mis Pacientes */}
        <Card title="Mis Pacientes" subtitle="Administra tus pacientes">
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Gestiona los perfiles de tus pacientes y su progreso terapéutico
            </p>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => navigate('/profesional/crear-paciente')}
                className="flex-1"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Paciente
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/profesional/pacientes')}
                className="flex-1"
              >
                Ver Todos
              </Button>
            </div>
          </div>
        </Card>

        {/* Mis Juegos */}
        <Card title="Mis Juegos" subtitle="Gestiona tus juegos educativos">
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Crea y administra juegos personalizados para tus pacientes
            </p>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => navigate('/profesional/crear-juego')}
                className="flex-1"
              >
                <Gamepad2 className="h-4 w-4 mr-2" />
                Crear Juego
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/profesional/juegos')}
                className="flex-1"
              >
                Ver Mis Juegos
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Actividad Reciente */}
      <Card className="mt-6" title="Actividad Reciente">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <Activity className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600">
            No hay actividad reciente
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Las sesiones de tus pacientes aparecerán aquí
          </p>
        </div>
      </Card>

      {/* Guía rápida */}
      <Card className="mt-6" title="Comienza Aquí">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Agrega Pacientes</h3>
            <p className="text-sm text-gray-600">
              Crea perfiles para tus pacientes
            </p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gamepad2 className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Crea Juegos</h3>
            <p className="text-sm text-gray-600">
              Diseña ejercicios personalizados
            </p>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Monitorea Progreso</h3>
            <p className="text-sm text-gray-600">
              Revisa las estadísticas de tus pacientes
            </p>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default ProfesionalDashboard;
