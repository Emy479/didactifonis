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
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  };

  const edad = calcularEdad(paciente.fechaNacimiento);
  const nombreCompleto = paciente.apellido
    ? `${paciente.nombre} ${paciente.apellido}`
    : paciente.nombre;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-6 w-6 text-blue-600" />
        </div>

        {/* Info + botón */}
        <div className="flex-1 min-w-0">
          {/* Nombre y botón en la misma fila */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-gray-900 leading-tight">
              {nombreCompleto}
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0"
              onClick={() => navigate(`/pacientes/${paciente._id}`)}
            >
              Ver Detalle
            </Button>
          </div>

          {/* Info básica */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{edad} años</span>
            </div>
            {paciente.diagnostico && (
              <div className="flex items-center gap-1 min-w-0">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="truncate max-w-[160px] sm:max-w-xs">
                  {paciente.diagnostico}
                </span>
              </div>
            )}
          </div>

          {/* Profesional */}
          {paciente.profesionalesAsignados?.length > 0 && (
            <p className="text-sm text-gray-500 mt-1 truncate">
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
    </Card>
  );
};

export default PatientCard;
