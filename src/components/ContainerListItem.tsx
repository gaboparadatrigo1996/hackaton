import React from "react";
import type { Contenedor } from "../types";
import { Trash2, AlertTriangle, ShieldAlert } from "lucide-react";

interface ListItemProps {
  contenedor: Contenedor;
  isSelected: boolean;
  onClick: () => void;
}

export const ContainerListItem: React.FC<ListItemProps> = ({
  contenedor,
  isSelected,
  onClick,
}) => {
  const { id, nombre, zona, nivelLlenado, estado } = contenedor;

  const getStatusColors = (level: number, status: string) => {
    if (status === "mantenimiento") {
      return {
        text: "text-accentPurpLight",
        bg: "bg-accentPurp/10",
        border: "border-accentPurp/20",
        bar: "bg-accentPurpLight",
      };
    }
    if (level < 40) {
      return {
        text: "text-accentGreen",
        bg: "bg-accentGreen/10",
        border: "border-accentGreen/20",
        bar: "bg-accentGreen",
      };
    }
    if (level <= 70) {
      return {
        text: "text-accentOrange",
        bg: "bg-accentOrange/10",
        border: "border-accentOrange/20",
        bar: "bg-accentOrange",
      };
    }
    return {
      text: "text-accentRed",
      bg: "bg-accentRed/10",
      border: "border-accentRed/20",
      bar: "bg-accentRed",
    };
  };

  const colors = getStatusColors(nivelLlenado, estado);

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border cursor-pointer select-none transition-all duration-200 ${
        isSelected
          ? "bg-panelBg border-accentPurp shadow-md shadow-accentPurp/10"
          : "bg-panelBg/40 border-panelBorder hover:border-textSec/30 hover:bg-panelBg/70"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Status Icon */}
          <div className={`p-2 rounded-lg ${colors.bg} ${colors.text} border ${colors.border}`}>
            {estado === "mantenimiento" ? (
              <ShieldAlert className="h-4 w-4" />
            ) : estado === "lleno" ? (
              <AlertTriangle className="h-4 w-4 animate-pulse" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </div>

          {/* Text Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-textSec bg-panelBorder px-1.5 py-0.5 rounded">
                {id}
              </span>
              <h4 className="text-xs font-bold text-textPri truncate">{nombre}</h4>
            </div>
            <p className="text-[10px] text-textSec mt-0.5 truncate">{zona}</p>
          </div>
        </div>

        {/* Fill Percentage */}
        <div className="text-right flex-shrink-0">
          <span className={`text-xs font-extrabold ${colors.text}`}>
            {estado === "mantenimiento" ? "Mant." : `${nivelLlenado}%`}
          </span>
        </div>
      </div>

      {/* Progress Bar (Hidden or static height for maintenance) */}
      <div className="mt-3 w-full bg-darkBg h-1.5 rounded-full overflow-hidden border border-panelBorder/30">
        <div
          style={{ width: `${estado === "mantenimiento" ? 100 : nivelLlenado}%` }}
          className={`h-full rounded-full transition-all duration-500 ease-out ${colors.bar}`}
        />
      </div>
    </div>
  );
};
