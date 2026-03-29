/**
 * Página Biblioteca de Juegos
 * Envuelve el componente BibliotecaJuegos en el layout del dashboard
 */

import DashboardLayout from "../../components/layout/DashboardLayout";
import BibliotecaJuegos from "../../components/games/BibliotecaJuegos";

const BibliotecaPage = () => {
  return (
    <DashboardLayout noPadding>
      <BibliotecaJuegos />
    </DashboardLayout>
  );
};

export default BibliotecaPage;
