import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useContainerStore } from "../store/useContainerStore";

export const StatusDonutChart: React.FC = () => {
  const { containers } = useContainerStore();

  const counts = {
    lleno: containers.filter((c) => c.estado === "lleno").length,
    medio: containers.filter((c) => c.estado === "medio").length,
    vacio: containers.filter((c) => c.estado === "vacio").length,
    mantenimiento: containers.filter((c) => c.estado === "mantenimiento").length,
  };

  const data = [
    { name: "Lleno", value: counts.lleno, color: "#ef4444" },
    { name: "Medio", value: counts.medio, color: "#f59e0b" },
    { name: "Vacío", value: counts.vacio, color: "#22c55e" },
    { name: "Mant.", value: counts.mantenimiento, color: "#a78bfa" },
  ].filter((item) => item.value > 0); // Omit 0 items to render nicely

  // Safe fallback if all are 0
  const hasData = data.length > 0;
  const displayData = hasData ? data : [{ name: "Sin datos", value: 1, color: "#26262f" }];

  return (
    <div className="bg-panelBg border border-panelBorder p-3 rounded-lg flex flex-col mt-3">
      <span className="text-[10px] text-textSec uppercase font-bold tracking-wider mb-2">
        Distribución de Estados
      </span>
      
      <div className="flex items-center justify-between gap-2 h-28">
        {/* Pie Chart Container */}
        <div className="w-[45%] h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={44}
                paddingAngle={3}
                dataKey="value"
              >
                {displayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#1a1a22" strokeWidth={1} />
                ))}
              </Pie>
              {hasData && (
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-darkBg border border-panelBorder px-2.5 py-1 rounded shadow-lg text-[10px] font-semibold">
                          <span style={{ color: data.color }}>{data.name}</span>
                          <span className="text-textPri ml-1.5 font-bold">{data.value}</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend panel */}
        <div className="flex-1 grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accentRed shadow-[0_0_4px_#ef4444]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-textSec leading-none">Llenos</span>
              <span className="font-bold text-textPri text-xs mt-0.5">{counts.lleno}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accentOrange shadow-[0_0_4px_#f59e0b]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-textSec leading-none">Medios</span>
              <span className="font-bold text-textPri text-xs mt-0.5">{counts.medio}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accentGreen shadow-[0_0_4px_#22c55e]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-textSec leading-none">Vacíos</span>
              <span className="font-bold text-textPri text-xs mt-0.5">{counts.vacio}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accentPurpLight shadow-[0_0_4px_#a78bfa]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-textSec leading-none">Mant.</span>
              <span className="font-bold text-textPri text-xs mt-0.5">{counts.mantenimiento}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
