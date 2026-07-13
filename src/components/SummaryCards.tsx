import React from "react";
import { useContainerStore } from "../store/useContainerStore";
import { Trash2, TrendingUp, AlertTriangle, ShieldAlert } from "lucide-react";

export const SummaryCards: React.FC = () => {
  const { containers } = useContainerStore();

  const total = containers.length;
  
  // Average fill level (excluding maintenance since they are offline)
  const activeContainers = containers.filter(c => c.estado !== "mantenimiento");
  const avgFill = activeContainers.length > 0
    ? Math.round(activeContainers.reduce((sum, c) => sum + c.nivelLlenado, 0) / activeContainers.length)
    : 0;

  const criticos = containers.filter(c => c.estado === "lleno").length;
  const mantenimiento = containers.filter(c => c.estado === "mantenimiento").length;

  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {/* Total Bins */}
      <div className="bg-panelBg border border-panelBorder p-3 rounded-lg flex flex-col justify-between hover:border-panelBorder/90 transition-all duration-300">
        <div className="flex items-center justify-between text-textSec">
          <span className="text-[10px] uppercase font-bold tracking-wider">Total</span>
          <Trash2 className="h-3.5 w-3.5" />
        </div>
        <div className="mt-2.5">
          <p className="text-xl font-extrabold text-textPri leading-none">{total}</p>
          <span className="text-[9px] text-textSec mt-1 block">Contenedores</span>
        </div>
      </div>

      {/* Avg Fill Level */}
      <div className="bg-panelBg border border-panelBorder p-3 rounded-lg flex flex-col justify-between hover:border-panelBorder/90 transition-all duration-300">
        <div className="flex items-center justify-between text-textSec">
          <span className="text-[10px] uppercase font-bold tracking-wider">Llenado Medio</span>
          <TrendingUp className="h-3.5 w-3.5" />
        </div>
        <div className="mt-2.5">
          <p className="text-xl font-extrabold text-textPri leading-none">{avgFill}%</p>
          <span className="text-[9px] text-textSec mt-1 block">Capacidad total</span>
        </div>
      </div>

      {/* Critical Bins */}
      <div className="bg-panelBg border border-panelBorder p-3 rounded-lg flex flex-col justify-between hover:border-accentRed/20 transition-all duration-300">
        <div className="flex items-center justify-between text-accentRed">
          <span className="text-[10px] uppercase font-bold tracking-wider">Críticos</span>
          <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
        </div>
        <div className="mt-2.5">
          <p className="text-xl font-extrabold text-accentRed leading-none">{criticos}</p>
          <span className="text-[9px] text-textSec mt-1 block">Llenos ahora</span>
        </div>
      </div>

      {/* Maintenance Bins */}
      <div className="bg-panelBg border border-panelBorder p-3 rounded-lg flex flex-col justify-between hover:border-accentPurp/20 transition-all duration-300">
        <div className="flex items-center justify-between text-accentPurpLight">
          <span className="text-[10px] uppercase font-bold tracking-wider">Mantenimiento</span>
          <ShieldAlert className="h-3.5 w-3.5" />
        </div>
        <div className="mt-2.5">
          <p className="text-xl font-extrabold text-accentPurpLight leading-none">{mantenimiento}</p>
          <span className="text-[9px] text-textSec mt-1 block">Fuera de servicio</span>
        </div>
      </div>
    </div>
  );
};
