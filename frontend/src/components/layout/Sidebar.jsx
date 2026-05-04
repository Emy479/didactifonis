/**
 * Sidebar Component
 * Menú lateral de navegación
 */

import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  BarChart3,
  UserPlus,
  Lightbulb,
  ShieldCheck,
  Wand2,
  Images,
  X,
} from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const tutorMenu = [
    { name: "Dashboard",          icon: LayoutDashboard, path: "/tutor/dashboard" },
    { name: "Mis Hijos",          icon: Users,           path: "/tutor/pacientes" },
    { name: "Biblioteca de Juegos",icon: Gamepad2,       path: "/tutor/biblioteca" },
    { name: "Progreso",           icon: BarChart3,       path: "/tutor/estadisticas" },
  ];

  const profesionalMenu = [
    { name: "Dashboard",          icon: LayoutDashboard, path: "/profesional/dashboard" },
    { name: "Mis Pacientes",      icon: Users,           path: "/profesional/pacientes" },
    { name: "Crear Paciente",     icon: UserPlus,        path: "/profesional/crear-paciente" },
    { name: "Biblioteca de Juegos",icon: Gamepad2,       path: "/profesional/biblioteca" },
    { name: "Estadísticas",       icon: BarChart3,       path: "/profesional/estadisticas" },
  ];

  const adminMenu = [
    { name: "Panel Admin",        icon: ShieldCheck,     path: "/admin/dashboard" },
    { name: "Gestión de Juegos",  icon: Gamepad2,        path: "/admin/juegos" },
    { name: "Game Builder",       icon: Wand2,           path: "/admin/game-builder" },
    { name: "Assets",             icon: Images,          path: "/admin/assets" },
    { name: "Sugerencias",        icon: Lightbulb,       path: "/admin/sugerencias" },
    { name: "Usuarios",           icon: Users,           path: "/admin/usuarios" },
  ];

  const menuItems =
    user?.role === "tutor"  ? tutorMenu  :
    user?.role === "admin"  ? adminMenu  :
                              profesionalMenu;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="h-full flex flex-col">
          {/* Header mobile */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <span className="text-lg font-bold text-gray-800 dark:text-gray-100">Didactifonis</span>
            </div>
            <button onClick={onClose} className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {menuItems.map((item) => (
              <NavLink key={item.path} to={item.path} onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`
                }>
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">© 2026 Didactifonis</div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
