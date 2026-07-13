import React from "react";
import { useContainerStore } from "../store/useContainerStore";

export const LevelBarChart: React.FC = () => {
  const { containers, selectedContainerId, setSelectedContainerId } = useContainerStore();

  const getColorClass = (level: number, estado: string) => {
    if (estado === "mantenimiento") return "bg-accentPurpLight/80 shadow-[0_0_4px_rgba(167,139,250,0.4)]";
    if (level < 40) return "bg-accentGreen/80 shadow-[0_0_4px_rgba(34,197,94,0.4)]";
    if (level <= 70) return "bg-accentOrange/80 shadow-[0_0_4px_rgba(245,158,11,0.4)]";
    return "bg-accentRed/80 shadow-[0_0_4px_rgba(239,68,68,0.4)]";
  };

  return (
    <div className="bg-panelBg border border-panelBorder p-3 rounded-lg flex flex-col mt-3">
      <span className="text-[10px] text-textSec uppercase font-bold tracking-wider mb-3">
        Nivel por Contenedor
      </span>

      {/* Bar Chart Container */}
      <div className="flex justify-between items-end h-20 gap-1.5 px-1 relative">
        {containers.map((c) => {
          const isSelected = selectedContainerId === c.id;
          const levelVal = c.estado === "mantenimiento" ? 15 : c.nivelLlenado; // Default level height for maintenance
          const heightPercent = `${Math.max(8, levelVal)}%`;

          return (
            <button
              key={c.id}
              onClick={() => setSelectedContainerId(c.id)}
              className="flex-1 flex flex-col items-center group focus:outline-none"
              title={`${c.id} (${c.nombre}): ${c.estado === "mantenimiento" ? "Mantenimiento" : `${c.nivelLlenado}%`}`}
            >
              {/* Tooltip on hover */}
              <div className="absolute bottom-24 opacity-0 group-hover:opacity-100 transition-opacity bg-darkBg border border-panelBorder text-[9px] px-2 py-1 rounded shadow-xl pointer-events-none whitespace-nowrap z-10">
                <span className="font-bold text-textPri">{c.id}</span>: {c.estado === "mantenimiento" ? "Mant." : `${c.nivelLlenado}%`}
              </div>

              {/* Bar */}
              <div className="w-full bg-darkBg border border-panelBorder rounded-t-sm h-16 flex items-end overflow-hidden relative">
                <div
                  style={{ height: heightPercent }}
                  className={`w-full rounded-t-sm transition-all duration-500 ease-out ${getColorClass(
                    c.nivelLlenado,
                    c.estado
                  )} ${isSelected ? "brightness-125 ring-1 ring-white/30" : "group-hover:brightness-110"}`}
                />
              </div>

              {/* Label */}
              <span
                className={`text-[8px] font-mono mt-1 transition-colors ${
                  isSelected ? "text-accentPurp font-bold" : "text-textSec group-hover:text-textPri"
                }`}
              >
                C{c.id.substring(1)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
