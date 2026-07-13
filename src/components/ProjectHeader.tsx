import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export const ProjectHeader: React.FC = () => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      setTime(`${hh}:${mm}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-14 bg-darkBgSec border-b border-panelBorder flex items-center justify-between px-4 z-[9998] relative">
      {/* Left side: W logo + title / subtitle */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 bg-gradient-to-br from-accentPurp to-accentPurpLight rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-accentPurp/20">
          W
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-extrabold text-textPri m-0 p-0 tracking-tight leading-tight">
              WasteMap
            </h1>
            <span className="text-[10px] text-accentPurp font-semibold bg-accentPurp/10 px-1.5 py-0.5 rounded-full border border-accentPurp/10">
              V2.4
            </span>
          </div>
          <span className="text-[10px] text-textSec font-medium leading-none mt-0.5">
            Gestión de Residuos · La Paz
          </span>
        </div>
      </div>

      {/* Right side: Active system indicator + Live time */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 bg-accentGreen/10 border border-accentGreen/20 px-3 py-1 rounded-full text-accentGreen font-semibold">
          <span className="h-1.5 w-1.5 bg-accentGreen rounded-full animate-ping" />
          <span className="h-1.5 w-1.5 bg-accentGreen rounded-full absolute" />
          <span className="pl-1">Sistema activo</span>
        </div>

        <div className="flex items-center gap-1.5 text-textSec font-mono bg-panelBg border border-panelBorder px-3 py-1 rounded-full">
          <Clock className="h-3.5 w-3.5 text-textSec" />
          <span>{time || "12:00"}</span>
        </div>
      </div>
    </div>
  );
};
