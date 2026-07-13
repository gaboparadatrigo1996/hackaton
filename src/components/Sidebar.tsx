import React from "react";
import { LayoutGrid } from "lucide-react";
import { SummaryCards } from "./SummaryCards";
import { StatusDonutChart } from "./StatusDonutChart";
import { LevelBarChart } from "./LevelBarChart";
import { ContainerList } from "./ContainerList";

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-[300px] border-r border-panelBorder bg-darkBg flex flex-col h-full p-4 flex-shrink-0">
      {/* Dashboard Toggle */}
      <div className="flex items-center gap-2 bg-panelBg border border-panelBorder p-2 rounded-lg text-xs font-semibold text-textPri select-none shadow-sm">
        <LayoutGrid className="h-4 w-4 text-accentPurp" />
        <span>Dashboard de Monitoreo</span>
        <span className="ml-auto h-2 w-2 rounded-full bg-accentGreen shadow-[0_0_4px_#22c55e]" />
      </div>

      {/* KPI Stats Summary (2x2) */}
      <SummaryCards />

      {/* State Donut Distribution */}
      <StatusDonutChart />

      {/* Micro-bar levels */}
      <LevelBarChart />

      {/* Scrollable Container list & filters */}
      <ContainerList />
    </aside>
  );
};
