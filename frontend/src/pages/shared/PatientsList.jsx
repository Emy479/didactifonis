import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/common/Button";
import PatientCard from "../../components/patients/PatientCard";
import { obtenerMisPacientes } from "../../api/patients";
import { UserPlus, Users } from "lucide-react";

const PatientsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarPacientes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await obtenerMisPacientes();
      setPacientes(response.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cargar pacientes");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    cargarPacientes();
  }, [cargarPacientes]);

  if (loading) {
    return (
      <DashboardLayout>
        {/* Cabecera skeleton */}
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        {/* Tarjetas skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Avatar + info */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                  <div className="space-y-2">
                    <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                {/* Botón */}
                <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user.role === "tutor" ? "Mis Hijos" : "Mis Pacientes"}
            </h1>
            <p className="text-gray-600 mt-1">
              {pacientes.length}{" "}
              {pacientes.length === 1 ? "paciente" : "pacientes"} registrados
            </p>
          </div>

          <Button
            onClick={() =>
              navigate(
                user.role === "tutor"
                  ? "/tutor/crear-paciente"
                  : "/profesional/crear-paciente",
              )
            }
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {user.role === "tutor" ? "Agregar Hijo/a" : "Nuevo Paciente"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {pacientes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {user.role === "tutor"
                ? "Aún no has agregado ningún hijo/a"
                : "Aún no tienes pacientes registrados"}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Comienza creando un perfil
            </p>
            <Button
              variant="primary"
              onClick={() =>
                navigate(
                  user.role === "tutor"
                    ? "/tutor/crear-paciente"
                    : "/profesional/crear-paciente",
                )
              }
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {user.role === "tutor"
                ? "Agregar Hijo/a"
                : "Crear Primer Paciente"}
            </Button>
          </div>
        ) : (
          pacientes.map((paciente) => (
            <PatientCard key={paciente._id} paciente={paciente} />
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientsList;
