import React from "react";
import { useContainerStore } from "../store/useContainerStore";
import { WeeklyFillChart } from "./WeeklyFillChart";
import {
  X,
  MapPin,
  Calendar,
  Layers,
  Navigation,
  CheckCircle2,
  Trash2,
} from "lucide-react";

interface ContainerDetailPanelProps {
  isLoading?: boolean;
}

export const ContainerDetailPanel: React.FC<ContainerDetailPanelProps> = ({
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
    proximaRecogida,
    totalRecogidas,
  } = container;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "mantenimiento":
        return {
          label: "Mantenimiento",
          text: "text-accentPurpLight",
          bg: "bg-accentPurp/10",
          border: "border-accentPurp/20",
          bar: "bg-accentPurpLight",
        };
      case "vacio":
        return {
          label: "Vacío",
          text: "text-accentGreen",
          bg: "bg-accentGreen/10",
          border: "border-accentGreen/20",
          bar: "bg-accentGreen",
        };
      case "medio":
        return {
          label: "Medio",
          text: "text-accentOrange",
          bg: "bg-accentOrange/10",
          border: "border-accentOrange/20",
          bar: "bg-accentOrange",
        };
      case "lleno":
        return {
          label: "Lleno",
          text: "text-accentRed",
          bg: "bg-accentRed/10",
          border: "border-accentRed/20",
          bar: "bg-accentRed",
        };
      default:
        return {
          label: "Indefinido",
          text: "text-textSec",
          bg: "bg-panelBg",
          border: "border-panelBorder",
          bar: "bg-panelBorder",
        };
    }
  };

  const statusConfig = getStatusConfig(estado);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Check if routing is active for this container
  const isRoutingToThis = routingMode === "single" && routingTargetId === id;

  const handleRouteToggle = () => {
    if (isRoutingToThis) {
      setRoutingMode("none");
    } else {
      setRoutingMode("single", id);
    }
  };

  return (
    <aside className="w-[300px] border-l border-panelBorder bg-darkBg flex flex-col h-full flex-shrink-0 animate-slide-in select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-panelBorder">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-black text-textPri bg-panelBorder px-2.5 py-0.5 rounded">
            {id}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
          >
            {statusConfig.label}
          </span>
        </div>
        <button
          onClick={() => setSelectedContainerId(null)}
          className="text-textSec hover:text-textPri p-1 hover:bg-panelBg rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main Details Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
        {/* Name and address */}
        <div>
          <h2 className="text-base font-extrabold text-textPri leading-snug">
            {nombre}
          </h2>
          <p className="text-xs text-textSec flex items-start gap-1 mt-1 leading-normal">
            <MapPin className="h-3.5 w-3.5 mt-0.5 text-accentPurp flex-shrink-0" />
            <span>{direccion}</span>
          </p>
        </div>

        {/* Fill level metrics card */}
        <div className="bg-panelBg border border-panelBorder p-3 rounded-lg flex flex-col">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-textSec">
              Nivel de Llenado
            </span>
            <span className={`text-2xl font-black ${statusConfig.text}`}>
              {estado === "mantenimiento" ? "—" : `${nivelLlenado}%`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-darkBg h-2 rounded-full overflow-hidden border border-panelBorder/30 mt-2">
            <div
              style={{
                width: `${estado === "mantenimiento" ? 0 : nivelLlenado}%`,
              }}
              className={`h-full rounded-full transition-all duration-500 ease-out ${statusConfig.bar}`}
            />
          </div>

          <div className="flex justify-between text-[9px] text-textSec mt-1.5 font-semibold">
            <span>0 L</span>
            <span className="text-textPri">
              {litrosActuales} L / {capacidadLitros} L
            </span>
          </div>
        </div>

        {/* Actions panel */}
        <div className="flex flex-col gap-2">
          {/* Cómo llegar Button */}
          <button
            onClick={handleRouteToggle}
            className={`w-full py-2 px-3 rounded-lg border font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
              isRoutingToThis
                ? "bg-accentRed/10 border-accentRed/30 text-accentRed hover:bg-accentRed/15"
                : "bg-accentPurp hover:bg-accentPurp/90 border-transparent text-white shadow-md shadow-accentPurp/15"
            }`}
          >
            <Navigation
              className={`h-3.5 w-3.5 ${isRoutingToThis ? "" : "fill-current"}`}
            />
            <span>
              {isRoutingToThis ? "Cancelar ruta" : "Cómo llegar (Ruta)"}
            </span>
          </button>

          {/* Collection Button */}
          <button
            onClick={() => triggerRecogida(id)}
            disabled={estado === "mantenimiento"}
            className="w-full py-2 px-3 bg-panelBg hover:bg-panelBg/70 border border-panelBorder text-textPri hover:text-accentGreen hover:border-accentGreen/30 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Registrar recogida (Vaciar)</span>
          </button>

          {/* Route loading indicator */}
          {isRoutingToThis && isRoutingLoading && (
            <div className="bg-panelBg border border-panelBorder/70 p-2.5 rounded-lg flex items-center gap-2 mt-1 border-dashed text-[11px] animate-slide-in text-textSec">
              <span className="h-3 w-3 rounded-full border-2 border-accentPurp border-t-transparent animate-spin" />
              Calculando ruta por calles reales...
            </div>
          )}

          {/* Route info overlay if active */}
          {isRoutingToThis && !isRoutingLoading && optimalRoute && (
            <div className="bg-panelBg border border-panelBorder/70 p-2.5 rounded-lg flex flex-col gap-1.5 mt-1 border-dashed text-[11px] animate-slide-in">
              <div className="flex justify-between text-textSec">
                <span>Distancia estimada:</span>
                <span className="font-bold text-textPri font-mono">
                  {optimalRoute.distance} km
                </span>
              </div>
              <div className="flex justify-between text-textSec">
                <span>Tiempo de viaje:</span>
                <span className="font-bold text-textPri font-mono">
                  {optimalRoute.duration} min
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Grid 2x2 of details */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          {/* Card 1: Tipo & Zona */}
          <div className="bg-panelBg border border-panelBorder p-2.5 rounded-lg flex flex-col">
            <span className="text-[9px] uppercase font-bold text-textSec tracking-wider">
              Tipo / Zona
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <Layers className="h-3.5 w-3.5 text-accentPurp flex-shrink-0" />
              <span className="text-xs font-bold text-textPri truncate">
                {tipo}
              </span>
            </div>
            <span className="text-[10px] text-textSec mt-0.5 truncate">
              {zona}
            </span>
          </div>

          {/* Card 2: Recogidas */}
          <div className="bg-panelBg border border-panelBorder p-2.5 rounded-lg flex flex-col">
            <span className="text-[9px] uppercase font-bold text-textSec tracking-wider">
              Recogidas
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <Trash2 className="h-3.5 w-3.5 text-accentPurp" />
              <span className="text-xs font-bold text-textPri font-mono">
                {totalRecogidas}
              </span>
            </div>
            <span className="text-[10px] text-textSec mt-0.5">
              Servicios totales
            </span>
          </div>

          {/* Card 3: Fechas de Recogida */}
          <div className="bg-panelBg border border-panelBorder p-2.5 rounded-lg flex flex-col col-span-2">
            <span className="text-[9px] uppercase font-bold text-textSec tracking-wider">
              Fechas de Recogida
            </span>

            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-textSec" />
                <span className="text-[10px] text-textSec">Última:</span>
              </div>
              <span className="text-[10px] font-bold text-textPri font-mono">
                {formatDate(ultimaRecogida)}
              </span>
            </div>

            <div className="flex items-center justify-between mt-1 pt-1 border-t border-panelBorder/30">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-accentPurpLight" />
                <span className="text-[10px] text-textSec">Próxima:</span>
              </div>
              <span className="text-[10px] font-bold text-accentPurpLight font-mono">
                {formatDate(proximaRecogida)}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Fill Chart */}
        <WeeklyFillChart contenedor={container} />
      </div>
    </aside>
  );
};
