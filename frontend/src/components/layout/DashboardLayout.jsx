/**
 * Dashboard Layout
 * Layout común para todas las páginas del dashboard
 */

import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const DashboardLayout = ({ children, noPadding = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex overflow-x-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <main className={`flex-1 ${noPadding ? "" : "p-6 lg:p-8"}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
