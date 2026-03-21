/**
 * Dashboard del Profesional
 * Vista principal para fonoaudiólogos
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatsCard from "../../components/common/StatsCard";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Spinner from "../../components/common/Spinner";
import { obtenerMisPacientes } from "../../api/patients";
import { obtenerMisSugerencias } from "../../api/suggestions";
import { Users, Gamepad2, Lightbulb, UserPlus, BookOpen } from "lucide-react";

const ProfesionalDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pacientes: 0,
    sugerencias: 0,
  });

  const cargarStats = useCallback(async () => {
    try {
      const [resPacientes, resSugerencias] = await Promise.all([
        obtenerMisPacientes(),
        obtenerMisSugerencias(),
      ]);
      setStats({
        pacientes: resPacientes.data?.length || 0,
        sugerencias: resSugerencias.data?.length || 0,
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

      {/* Stats reales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatsCard
          title="Pacientes Activos"
          value={stats.pacientes}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Sugerencias Enviadas"
          value={stats.sugerencias}
          icon={Lightbulb}
          color="purple"
        />
      </div>

      {/* Acciones principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Mis Pacientes */}
        <Card title="Mis Pacientes" subtitle="Administra tus pacientes">
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Gestiona los perfiles de tus pacientes y su progreso terapéutico
            </p>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => navigate("/profesional/crear-paciente")}
                className="flex-1"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Paciente
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/profesional/pacientes")}
                className="flex-1"
              >
                Ver Todos
              </Button>
            </div>
          </div>
        </Card>

        {/* Biblioteca de Juegos */}
        <Card
          title="Biblioteca de Juegos"
          subtitle="Asigna juegos a tus pacientes"
        >
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Explora los juegos oficiales y asígnalos según las necesidades de
              cada paciente
            </p>
            <Button
              variant="primary"
              onClick={() => navigate("/profesional/biblioteca")}
              className="w-full"
            >
              <Gamepad2 className="h-4 w-4 mr-2" />
              Ir a la Biblioteca
            </Button>
          </div>
        </Card>
      </div>

      {/* Sugerencias */}
      <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Lightbulb className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¿Necesitas un juego que no existe?
            </h3>
            <p className="text-gray-700 mb-4 text-sm">
              Sugiere juegos educativos para tus pacientes. El equipo de
              Didactifonis revisará tu propuesta y te dará feedback.
            </p>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => navigate("/profesional/sugerir-juego")}
              >
                💡 Sugerir Juego
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/profesional/sugerencias")}
              >
                Ver Sugerencias
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Comienza Aquí */}
      <Card title="Comienza Aquí">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="text-center p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={() => navigate("/profesional/crear-paciente")}
          >
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              1. Agrega Pacientes
            </h3>
            <p className="text-sm text-gray-600">
              Crea perfiles para tus pacientes
            </p>
          </div>

          <div
            className="text-center p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => navigate("/profesional/biblioteca")}
          >
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              2. Asigna Juegos
            </h3>
            <p className="text-sm text-gray-600">
              Elige juegos apropiados para cada paciente
            </p>
          </div>

          <div
            className="text-center p-4 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
            onClick={() => navigate("/profesional/sugerir-juego")}
          >
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lightbulb className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              3. Sugiere Juegos
            </h3>
            <p className="text-sm text-gray-600">
              Propón nuevos juegos a la comunidad
            </p>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default ProfesionalDashboard;
