import React from "react";
import { LayoutGrid, RefreshCw, ServerOff } from "lucide-react";
import { SummaryCards } from "./SummaryCards";
import { StatusDonutChart } from "./StatusDonutChart";
import { LevelBarChart } from "./LevelBarChart";
import { ContainerList } from "./ContainerList";

interface SidebarProps {
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  refetch?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isLoading,
  isError,
  error,
  refetch,
}) => {
  return (
    <aside className="w-[300px] border-r border-panelBorder bg-darkBg flex flex-col h-full p-4 flex-shrink-0 select-none">
      {/* Dashboard Toggle / Status */}
      <div className="flex items-center gap-2 bg-panelBg border border-panelBorder p-2 rounded-lg text-xs font-semibold text-textPri shadow-sm">
        <LayoutGrid className="h-4 w-4 text-accentPurp" />
        <span>Dashboard de Monitoreo</span>
        <span
          className={`ml-auto h-2 w-2 rounded-full shadow-[0_0_4px_currentColor] ${
            isError
              ? "bg-accentRed text-accentRed"
              : isLoading
              ? "bg-accentOrange text-accentOrange animate-ping"
              : "bg-accentGreen text-accentGreen"
          }`}
        />
      </div>

      {/* Error state banner */}
      {isError && (
        <div className="mt-3 bg-accentRed/10 border border-accentRed/30 p-3 rounded-lg flex flex-col gap-2 animate-slide-in">
          <div className="flex items-center gap-2 text-accentRed text-xs font-bold">
            <ServerOff className="h-4 w-4 flex-shrink-0" />
            <span>Error de conexión API Azure</span>
          </div>
          <p className="text-[10px] text-textSec leading-normal">
            {error?.message || "No se pudo obtener la lista de sensores del servidor backend."}
          </p>
          {refetch && (
            <button
              onClick={() => refetch()}
              className="mt-1 flex items-center justify-center gap-1.5 bg-accentRed hover:bg-accentRed/90 text-white text-xs font-bold py-1.5 px-3 rounded transition-all shadow"
            >
              <RefreshCw className="h-3 w-3 animate-spin-once" />
              <span>Reintentar conexión</span>
            </button>
          )}
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="flex flex-col gap-3 mt-3 animate-pulse">
          {/* KPI Skeleton Grid */}
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-panelBg/60 border border-panelBorder/50 h-20 rounded-lg p-3 flex flex-col justify-between"
              >
                <div className="h-3 bg-panelBorder/60 rounded w-12" />
                <div className="h-6 bg-panelBorder/80 rounded w-16 mt-2" />
              </div>
            ))}
          </div>

          {/* Donut Skeleton */}
          <div className="bg-panelBg/60 border border-panelBorder/50 h-32 rounded-lg p-3 flex flex-col gap-2">
            <div className="h-3 bg-panelBorder/60 rounded w-24" />
            <div className="flex items-center gap-4 h-full">
              <div className="h-16 w-16 rounded-full bg-panelBorder/60" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-3 bg-panelBorder/50 rounded w-full" />
                <div className="h-3 bg-panelBorder/50 rounded w-3/4" />
              </div>
            </div>
          </div>

          {/* Bar Chart Skeleton */}
          <div className="bg-panelBg/60 border border-panelBorder/50 h-24 rounded-lg p-3 flex flex-col justify-between">
            <div className="h-3 bg-panelBorder/60 rounded w-28" />
            <div className="flex items-end gap-1.5 h-14 pt-2">
              {[40, 70, 25, 90, 50, 80, 35, 60].map((h, idx) => (
                <div
                  key={idx}
                  style={{ height: `${h}%` }}
                  className="flex-1 bg-panelBorder/60 rounded-t"
                />
              ))}
            </div>
          </div>

          {/* List Skeleton */}
          <div className="flex flex-col gap-2 flex-1 mt-2">
            <div className="h-3 bg-panelBorder/60 rounded w-20" />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 bg-panelBg/40 border border-panelBorder/40 rounded-lg"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* KPI Stats Summary (2x2) */}
          <SummaryCards />

          {/* State Donut Distribution */}
          <StatusDonutChart />

          {/* Micro-bar levels */}
          <LevelBarChart />

          {/* Scrollable Container list & filters */}
          <ContainerList />
        </>
      )}
    </aside>
  );
};
