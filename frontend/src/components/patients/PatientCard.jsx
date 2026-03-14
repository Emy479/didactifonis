/**
 * Componente PatientCard
 * Compatible con modelo Patient dual
 */

import { useNavigate } from "react-router-dom";
import Card from "../common/Card";
import Button from "../common/Button";
import { User, Calendar, FileText } from "lucide-react";

const PatientCard = ({ paciente }) => {
  const navigate = useNavigate();

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return "N/A";

    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  };

  const edad = calcularEdad(paciente.fechaNacimiento);

  // Construir nombre completo
  const nombreCompleto = paciente.apellido
    ? `${paciente.nombre} ${paciente.apellido}`
    : paciente.nombre;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          {/* Avatar */}
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-6 w-6 text-blue-600" />
          </div>

          <div className="flex-1">
            {/* Nombre */}
            <h3 className="text-lg font-semibold text-gray-900">
              {nombreCompleto}
            </h3>

            {/* Info básica */}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{edad} años</span>
              </div>

              {paciente.diagnostico && (
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span className="truncate max-w-xs">
                    {paciente.diagnostico}
                  </span>
                </div>
              )}
            </div>

            {/* Profesionales asignados */}
            {paciente.profesionalesAsignados &&
              paciente.profesionalesAsignados.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Profesional:{" "}
                  {paciente.profesionalesAsignados
                    .map((prof) =>
                      typeof prof === "object" ? prof.nombre : "Cargando...",
                    )
                    .join(", ")}
                </p>
              )}

            {/* Tipo de cuenta */}
            {paciente.tipoCuenta && (
              <span
                className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                  paciente.tipoCuenta === "familiar"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {paciente.tipoCuenta === "familiar"
                  ? "Plan Familiar"
                  : "Plan Profesional"}
              </span>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/pacientes/${paciente._id}`)}
          >
            Ver Detalle
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PatientCard;
