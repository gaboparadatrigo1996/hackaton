import React from "react";
import { useContainerStore } from "../store/useContainerStore";

export const LevelBarChart: React.FC = () => {
  const { containers, selectedContainerId, setSelectedContainerId } =
    useContainerStore();

  const getColorClass = (level: number, estado: string) => {
    if (estado === "mantenimiento")
      return "bg-accentPurpLight shadow-[0_0_4px_rgba(167,139,250,0.4)]";
    if (level < 40)
      return "bg-accentGreen shadow-[0_0_4px_rgba(34,197,94,0.4)]";
    if (level <= 70)
      return "bg-accentOrange shadow-[0_0_4px_rgba(245,158,11,0.4)]";
    return "bg-accentRed shadow-[0_0_4px_rgba(239,68,68,0.4)]";
  };

  return (
    <div className="glass-card-subtle border border-white/10 p-3 rounded-xl flex flex-col mt-3">
      <span className="text-[10px] text-textSec uppercase font-bold tracking-wider mb-2.5">
        Nivel por Contenedor
      </span>

      {/* Lista vertical de contenedores con barras de progreso horizontales */}
      <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {containers.map((c) => {
          const isSelected = selectedContainerId === c.id;
          const levelVal = c.estado === "mantenimiento" ? 15 : c.nivelLlenado;

          return (
            <button
              key={c.id}
              onClick={() => setSelectedContainerId(c.id)}
              className={`w-full text-left p-2 rounded-xl border transition-all flex flex-col gap-1.5 focus:outline-none ${
                isSelected
                  ? "bg-[#161624]/90 border-accentPurp/60 shadow-md"
                  : "bg-[#0f0f18]/60 border-white/5 hover:bg-[#181826]/80 hover:border-white/20"
              }`}
              title={`${c.id} (${c.nombre}): ${
                c.estado === "mantenimiento"
                  ? "Mantenimiento"
                  : `${c.nivelLlenado}%`
              }`}
            >
              {/* Encabezado de la fila: ID del Contenedor + Porcentaje / Estado */}
              <div className="flex justify-between items-center text-[10px]">
                <span
                  className={`font-mono font-bold ${
                    isSelected ? "text-accentPurpLight" : "text-textPri"
                  }`}
                >
                  {c.id}
                </span>
                <span
                  className={`font-mono font-semibold ${
                    isSelected ? "text-accentPurpLight" : "text-textSec"
                  }`}
                >
                  {c.estado === "mantenimiento"
                    ? "Mant."
                    : `${c.nivelLlenado}%`}
                </span>
              </div>

              {/* Barra de Progreso Horizontal */}
              <div className="w-full bg-darkBg border border-panelBorder/80 rounded-full h-2 overflow-hidden">
                <div
                  style={{ width: `${Math.max(5, levelVal)}%` }}
                  className={`h-full rounded-full transition-all duration-500 ease-out ${getColorClass(
                    c.nivelLlenado,
                    c.estado
                  )}`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

