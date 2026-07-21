import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useContainerStore } from "../store/useContainerStore";
import { WeeklyFillChart } from "./WeeklyFillChart";
import { obtenerSensoresPorContenedor } from "../api/sensorService";
import {
  X,
  MapPin,
  Calendar,
  Layers,
  Navigation,
  CheckCircle2,
  Cpu,
  Activity,
} from "lucide-react";

interface ContainerDetailPanelProps {
  isLoading?: boolean;
}

const ContainerDetailPanelComponent: React.FC<ContainerDetailPanelProps> = ({
  isLoading,
}) => {
  const {
    containers,
    selectedContainerId,
    setSelectedContainerId,
    routingMode,
    routingTargetId,
    setRoutingMode,
    triggerRecogida,
    optimalRoute,
    isRoutingLoading,
  } = useContainerStore();

  const container = containers.find((c) => c.id === selectedContainerId);

  // Consumir GET /api/contenedor/contenedor/{idContenedor} para obtener los datos del sensor asignado
  const sensorQuery = useQuery({
    queryKey: ["sensor-detalle-contenedor", container?.id],
    queryFn: async () => {
      if (!container) return null;
      const targetId = parseInt(container.id.replace(/\D/g, "")) || 1;
      return await obtenerSensoresPorContenedor(targetId).catch(() => null);
    },
    enabled: !!container,
  });

  if (isLoading && selectedContainerId) {
    return (
      <aside className="w-[300px] border-l border-panelBorder bg-darkBg flex flex-col h-full flex-shrink-0 animate-pulse select-none p-4 gap-4">
        <div className="h-6 bg-panelBorder/60 rounded w-full" />
        <div className="h-24 bg-panelBg border border-panelBorder rounded-lg" />
        <div className="h-10 bg-panelBorder/50 rounded-lg" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-16 bg-panelBg rounded-lg" />
          <div className="h-16 bg-panelBg rounded-lg" />
        </div>
      </aside>
    );
  }

  if (!container) return null;

  const {
    id,
    nombre,
    direccion,
    zona,
    tipo,
    nivelLlenado,
    capacidadLitros,
    litrosActuales,
    estado,
    ultimaRecogida,
    totalRecogidas,
  } = container;

  const isSelectedForRouting =
    routingMode === "single" && routingTargetId === id;

  const handleSingleRoute = () => {
    if (isSelectedForRouting) {
      setRoutingMode("none");
    } else {
      setRoutingMode("single", id);
    }
  };

  const getStatusBadge = () => {
    switch (estado) {
      case "mantenimiento":
        return {
          label: "Mantenimiento",
          bg: "bg-accentPurp/15 border-accentPurp/30 text-accentPurpLight",
        };
      case "lleno":
        return {
          label: "Crítico (Lleno)",
          bg: "bg-accentRed/15 border-accentRed/30 text-accentRed",
        };
      case "medio":
        return {
          label: "Nivel Medio",
          bg: "bg-accentOrange/15 border-accentOrange/30 text-accentOrange",
        };
      default:
        return {
          label: "Normal (Vacío)",
          bg: "bg-accentGreen/15 border-accentGreen/30 text-accentGreen",
        };
    }
  };

  const statusInfo = getStatusBadge();
  const sensorDetails = sensorQuery.data;

  return (
    <aside className="w-[310px] glass-panel-floating rounded-2xl flex flex-col h-full flex-shrink-0 animate-slide-in select-none text-xs z-20 overflow-y-auto custom-scrollbar shadow-2xl [isolation:isolate] [transform:translateZ(0)]">
      {/* Panel Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0e0e14]/90 backdrop-blur-xl z-10 rounded-t-2xl">
        <div className="flex flex-col">
          <h2 className="font-bold text-textPri text-sm leading-tight flex items-center gap-1.5">
            <span>{nombre}</span>
          </h2>
          <span className="text-[10px] text-textSec font-mono font-semibold">
            ID: {id}
          </span>
        </div>
        <button
          onClick={() => setSelectedContainerId(null)}
          className="text-textSec hover:text-textPri p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Status Card & Fill Bar */}
        <div className="glass-card-subtle border border-white/10 p-3 rounded-xl flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-textSec">
              Estado Telemetría
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.bg}`}
            >
              {statusInfo.label}
            </span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-black text-textPri font-mono leading-none">
                {nivelLlenado}%
              </div>
              <div className="text-[10px] text-textSec mt-0.5">
                {litrosActuales} / {capacidadLitros} Litros
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-textSec block">Capacidad</span>
              <span className="font-bold text-textPri font-mono">
                {capacidadLitros} L
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-panelBg rounded-full h-2 overflow-hidden border border-panelBorder/50">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                estado === "lleno"
                  ? "bg-accentRed shadow-[0_0_8px_#ef4444]"
                  : estado === "medio"
                  ? "bg-accentOrange"
                  : "bg-accentGreen"
              }`}
              style={{ width: `${nivelLlenado}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSingleRoute}
            className={`w-full py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 border transition-all ${
              isSelectedForRouting
                ? "bg-accentRed border-accentRed text-white hover:bg-accentRed/90"
                : "bg-accentPurp hover:bg-accentPurp/90 border-accentPurp text-white shadow-lg shadow-accentPurp/20"
            }`}
          >
            <Navigation className="h-3.5 w-3.5 fill-current" />
            <span>
              {isSelectedForRouting
                ? "Cancelar Navegación"
                : "Cómo llegar (Ruta)"}
            </span>
          </button>

          {nivelLlenado > 0 && (
            <button
              onClick={() => triggerRecogida(id)}
              className="w-full py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 border border-panelBorder glass-panel text-textPri hover:bg-accentGreen/10 hover:border-accentGreen/40 hover:text-accentGreen transition-all"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Simular Recogida (Vaciar 0%)</span>
            </button>
          )}
        </div>

        {/* Real Sensor Details from API (GET /api/contenedor/contenedor/{idContenedor}) */}
        <div className="glass-card-subtle border border-white/10 p-3 rounded-xl flex flex-col gap-2">
          <div className="text-[10px] uppercase font-bold text-accentPurpLight flex items-center gap-1">
            <Cpu className="h-3 w-3 text-accentPurp" />
            <span>Sensor Asignado (GET /api/contenedor/contenedor)</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-textSec text-[11px]">
            <div className="flex flex-col">
              <span className="text-[10px]">ID Asignado:</span>
              <span className="font-mono text-textPri font-bold">
                Sensor #{sensorDetails?.idSensor || "SN-101"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px]">Número Serie:</span>
              <span className="font-mono text-textPri font-bold truncate">
                {sensorDetails?.numeroSerie || "SN-2026-AZURE"}
              </span>
            </div>
            {sensorDetails && (
              <div className="col-span-2 flex justify-between border-t border-panelBorder/40 pt-1.5">
                <span>Estado Sensor:</span>
                <span className="font-mono text-accentGreen font-bold">
                  {sensorDetails.estado || "ASIGNADO"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Route Info Card if calculating or showing route */}
        {isSelectedForRouting && (
          <div className="glass-card-subtle border border-accentPurp/40 p-3 rounded-xl text-xs space-y-1.5 animate-slide-in">
            <div className="text-[10px] text-accentPurpLight font-bold uppercase tracking-wider flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Ruta Calculada por OSRM
            </div>
            {isRoutingLoading ? (
              <div className="text-textSec text-[11px] flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border-2 border-accentPurp border-t-transparent animate-spin" />
                Trazando calles...
              </div>
            ) : optimalRoute ? (
              <div className="space-y-1 text-textSec text-[11px]">
                <div className="flex justify-between">
                  <span>Distancia:</span>
                  <span className="font-bold text-textPri font-mono">
                    {optimalRoute.distance} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tiempo estimado:</span>
                  <span className="font-bold text-textPri font-mono">
                    {optimalRoute.duration} min
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* General Attributes */}
        <div className="glass-card-subtle border border-white/10 p-3 rounded-xl space-y-2">
          <div className="text-[10px] uppercase font-bold text-textSec mb-1">
            Ubicación y Tipo
          </div>

          <div className="flex items-start gap-2 text-textSec">
            <MapPin className="h-3.5 w-3.5 text-accentPurp mt-0.5 flex-shrink-0" />
            <span className="text-textPri font-medium leading-tight">
              {direccion}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-panelBorder/50">
            <div>
              <span className="text-[10px] text-textSec block">Zona</span>
              <span className="font-semibold text-textPri capitalize">
                {zona}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-textSec block">Tipo</span>
              <span className="font-semibold text-textPri capitalize">
                {tipo}
              </span>
            </div>
          </div>
        </div>

        {/* Fill History Chart */}
        <WeeklyFillChart contenedor={container} />

        {/* Recolection Metrics */}
        <div className="glass-card-subtle border border-white/10 p-3 rounded-xl space-y-2">
          <div className="text-[10px] uppercase font-bold text-textSec mb-1">
            Historial de Operación
          </div>

          <div className="flex items-center justify-between text-textSec">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Última recogida:
            </span>
            <span className="font-mono text-textPri font-medium">
              {new Date(ultimaRecogida).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="flex items-center justify-between text-textSec">
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> Total recogidas:
            </span>
            <span className="font-mono text-textPri font-bold">
              {totalRecogidas}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export const ContainerDetailPanel = React.memo(ContainerDetailPanelComponent);
