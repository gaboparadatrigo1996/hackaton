import React from "react";
import { useContainerStore } from "../store/useContainerStore";
import { ContainerListItem } from "./ContainerListItem";
import { Search, Filter, RefreshCw } from "lucide-react";

export const ContainerList: React.FC = () => {
  const {
    containers,
    selectedContainerId,
    setSelectedContainerId,
    searchQuery,
    setSearchQuery,
    filterZona,
    setFilterZona,
    filterEstado,
    setFilterEstado,
    filterTipo,
    setFilterTipo,
  } = useContainerStore();

  // Extract unique zones for filters
  const zones = ["all", ...new Set(containers.map((c) => c.zona))];
  const states = ["all", "vacio", "medio", "lleno", "mantenimiento"];
  const types = ["all", "General", "Reciclaje", "Orgánico", "Vidrio"];

  // Filter list
  const filteredContainers = containers.filter((c) => {
    const matchesSearch =
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.direccion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZona = filterZona === "all" || c.zona === filterZona;
    const matchesEstado = filterEstado === "all" || c.estado === filterEstado;
    const matchesTipo = filterTipo === "all" || c.tipo === filterTipo;

    return matchesSearch && matchesZona && matchesEstado && matchesTipo;
  });

  const resetFilters = () => {
    setSearchQuery("");
    setFilterZona("all");
    setFilterEstado("all");
    setFilterTipo("all");
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 mt-3 border-t border-panelBorder pt-3">
      {/* Search Input */}
      <div className="relative mb-2">
        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-textSec">
          <Search className="h-3.5 w-3.5" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar contenedor, zona o dir..."
          className="w-full bg-darkBg border border-panelBorder focus:border-accentPurp focus:ring-1 focus:ring-accentPurp/30 rounded-lg pl-8 pr-3 py-1.5 text-xs text-textPri placeholder:text-textSec focus:outline-none transition-all"
        />
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-3 gap-1 mb-3">
        {/* Zone Filter */}
        <select
          value={filterZona}
          onChange={(e) => setFilterZona(e.target.value)}
          className="bg-darkBg border border-panelBorder text-[10px] text-textPri rounded p-1 focus:outline-none focus:border-accentPurp cursor-pointer"
        >
          <option value="all">Zonas</option>
          {zones.filter(z => z !== "all").map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>

        {/* State Filter */}
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="bg-darkBg border border-panelBorder text-[10px] text-textPri rounded p-1 focus:outline-none focus:border-accentPurp cursor-pointer"
        >
          <option value="all">Estados</option>
          {states.filter(s => s !== "all").map((s) => (
            <option key={s} value={s}>
              {s === "vacio" ? "Vacío" : s === "medio" ? "Medio" : s === "lleno" ? "Lleno" : "Mantenimiento"}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="bg-darkBg border border-panelBorder text-[10px] text-textPri rounded p-1 focus:outline-none focus:border-accentPurp cursor-pointer"
        >
          <option value="all">Tipos</option>
          {types.filter(t => t !== "all").map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Title & Count */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-textSec uppercase font-bold tracking-wider">
          Contenedores ({filteredContainers.length})
        </span>
        
        {(searchQuery || filterZona !== "all" || filterEstado !== "all" || filterTipo !== "all") && (
          <button
            onClick={resetFilters}
            className="text-[9px] font-semibold text-accentPurpLight hover:text-accentPurp flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Scrollable Container List */}
      <div className="flex-1 overflow-y-auto pr-1 gap-2 flex flex-col custom-scrollbar">
        {filteredContainers.length > 0 ? (
          filteredContainers.map((c) => (
            <ContainerListItem
              key={c.id}
              contenedor={c}
              isSelected={selectedContainerId === c.id}
              onClick={() => setSelectedContainerId(c.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-panelBorder rounded-lg bg-panelBg/10">
            <Filter className="h-6 w-6 text-textSec mb-2 opacity-50" />
            <p className="text-xs text-textSec font-medium">Ningún contenedor coincide</p>
            <button
              onClick={resetFilters}
              className="text-xs text-accentPurpLight font-semibold mt-1 hover:underline"
            >
              Reiniciar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
