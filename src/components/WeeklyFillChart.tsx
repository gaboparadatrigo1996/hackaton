import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { Contenedor } from "../types";

interface WeeklyFillChartProps {
  contenedor: Contenedor;
}

export const WeeklyFillChart: React.FC<WeeklyFillChartProps> = ({ contenedor }) => {
  const data = contenedor.historialSemanal;

  return (
    <div className="w-full h-36 bg-darkBg border border-panelBorder/70 rounded-lg p-2.5 mt-2">
      <span className="text-[10px] text-textSec uppercase font-bold tracking-wider block mb-1">
        Llenado Semanal (%)
      </span>
      
      <div className="w-full h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#26262f" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="dia"
              stroke="#8a8a94"
              fontSize={8}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#8a8a94"
              fontSize={8}
              tickLine={false}
              axisLine={false}
              tickCount={5}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-darkBg border border-panelBorder px-2.5 py-1 rounded shadow-lg text-[9px] font-semibold font-mono">
                      <span className="text-textSec mr-1">{payload[0].payload.dia}:</span>
                      <span className="text-accentPurpLight font-bold">{payload[0].value}%</span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="nivel"
              stroke="#7c3aed"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
