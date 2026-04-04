/**
 * Panel de Administración
 * Dashboard principal del admin con acceso a gestión de juegos, sugerencias y usuarios
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { obtenerJuegos } from "../../api/games";
import { obtenerSugerencias } from "../../api/games";
import { obtenerStatsAdmin } from "../../api/admin";
import { Gamepad2, Lightbulb, Users, CheckCircle } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalJuegos: 0,
    juegosPublicados: 0,
    sugerenciasPendientes: 0,
    sugerenciasEnRevision: 0,
    totalUsuarios: 0,
    profesionalesPendientes: 0,
  });

  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarStats = async () => {
      try {
        const [resJuegos, resSugerencias, resAdmin] = await Promise.all([
          obtenerJuegos(),
          obtenerSugerencias(),
          obtenerStatsAdmin(),
        ]);

        const juegos = resJuegos.data;
        const sugerencias = resSugerencias.data;
        const admin = resAdmin.data;

        setStats({
          totalJuegos: juegos.length,
          juegosPublicados: juegos.filter((j) => j.publicado).length,
          sugerenciasPendientes: sugerencias.filter(
            (s) => s.estado === "pendiente",
          ).length,
          sugerenciasEnRevision: sugerencias.filter(
            (s) => s.estado === "en_revision",
          ).length,
          totalUsuarios: admin.totalUsuarios || 0,
          profesionalesPendientes: admin.profesionalesPendientes || 0,
        });
      } catch (err) {
        console.error("Error al cargar stats:", err);
      } finally {
        setCargando(false);
      }
    };

    cargarStats();
  }, []);

  const tarjetas = [
    {
      titulo: "Total Juegos",
      valor: stats.totalJuegos,
      subtitulo: `${stats.juegosPublicados} publicados`,
      icono: Gamepad2,
      color: "blue",
      ruta: "/admin/juegos",
      accion: "Gestionar Juegos",
    },
    {
      titulo: "Sugerencias Pendientes",
      valor: stats.sugerenciasPendientes,
      subtitulo: `${stats.sugerenciasEnRevision} en revisión`,
      icono: Lightbulb,
      color: "yellow",
      ruta: "/admin/sugerencias",
      accion: "Ver Sugerencias",
    },
    {
      titulo: "Gestión de Usuarios",
      valor: stats.totalUsuarios,
      subtitulo: `${stats.profesionalesPendientes} profesionales pendientes`,
      icono: Users,
      color: "green",
      ruta: "/admin/usuarios",
      accion: "Gestionar Usuarios",
    },
  ];

  const colores = {
    blue: {
      bg: "bg-blue-50",
      icon: "bg-blue-100",
      text: "text-blue-600",
      btn: "bg-blue-600 hover:bg-blue-700",
    },
    yellow: {
      bg: "bg-yellow-50",
      icon: "bg-yellow-100",
      text: "text-yellow-600",
      btn: "bg-yellow-500 hover:bg-yellow-600",
    },
    green: {
      bg: "bg-green-50",
      icon: "bg-green-100",
      text: "text-green-600",
      btn: "bg-green-600 hover:bg-green-700",
    },
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Cabecera */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Panel de Administración
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona los juegos oficiales, sugerencias y usuarios de la plataforma
          </p>
        </div>

        {/* Tarjetas de acceso rápido */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tarjetas.map((t) => {
            const c = colores[t.color];
            const Icono = t.icono;
            return (
              <div
                key={t.titulo}
                className={`${c.bg} rounded-2xl p-6 border border-gray-100`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 ${c.icon} rounded-xl flex items-center justify-center`}
                  >
                    <Icono className={`h-6 w-6 ${c.text}`} />
                  </div>
                  {cargando ? (
                    <div className="w-10 h-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <span className="text-3xl font-bold text-gray-900">
                      {t.valor}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{t.titulo}</h3>
                <p className="text-sm text-gray-500 mb-4">{t.subtitulo}</p>
                <button
                  onClick={() => navigate(t.ruta)}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${c.btn}`}
                >
                  {t.accion}
                </button>
              </div>
            );
          })}
        </div>

        {/* Accesos rápidos adicionales */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
            onClick={() => navigate("/admin/juegos")}
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Gamepad2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Crear Juego Oficial
              </p>
              <p className="text-xs text-gray-500">
                Agrega un nuevo juego a la biblioteca
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-yellow-300 transition-colors"
            onClick={() => navigate("/admin/sugerencias")}
          >
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Revisar Sugerencias
              </p>
              <p className="text-xs text-gray-500">
                Aprueba o rechaza propuestas de profesionales
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
