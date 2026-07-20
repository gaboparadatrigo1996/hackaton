import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { useContainerStore } from "../store/useContainerStore";
import { useVehicleSimulation } from "../hooks/useVehicleSimulation";
import type { LiveCochePosition } from "../hooks/useVehicleSimulation";
import { Truck, RefreshCw, AlertTriangle, Play, Pause, Navigation, X, ShieldCheck } from "lucide-react";

interface MapViewProps {
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  refetch?: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  isLoading,
  isError,
  error,
  refetch,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const cocheMarkersRef = useRef<{ [idCoche: number]: L.Marker }>({});
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const operatorMarkerRef = useRef<L.Marker | null>(null);

  const {
    containers,
    selectedContainerId,
    setSelectedContainerId,
    routingMode,
    operatorLocation,
    setOperatorLocation,
    optimalRoute,
    setRoutingMode,
    isRoutingLoading,
    coches,
    selectedCocheId,
    setSelectedCocheId,
    isSimulatingVehicles,
    toggleSimulatingVehicles,
  } = useContainerStore();

  // Hook de simulación en tiempo real para la flota de coches (GET /api/coches)
  const liveCoches = useVehicleSimulation();

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-16.512, -68.128],
      zoom: 13,
      zoomControl: false,
    });

    L.control
      .zoom({
        position: "topleft",
      })
      .addTo(map);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }
    ).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Manage Bins Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const getMarkerHTML = (
      level: number,
      estado: string,
      isSelected: boolean
    ) => {
      let colorClass = "bg-accentGreen";
      let pulseClass = "pulse-green bg-accentGreen/30";

      if (estado === "mantenimiento") {
        colorClass = "bg-accentPurpLight";
        pulseClass = "pulse-purp bg-accentPurp/30";
      } else if (level >= 85) {
        colorClass = "bg-accentRed";
        pulseClass = "pulse-red bg-accentRed/30";
      } else if (level >= 40) {
        colorClass = "bg-accentOrange";
        pulseClass = "pulse-orange bg-accentOrange/30";
      }

      const ringGlow = isSelected
        ? "ring-2 ring-white scale-125 z-[1000]"
        : "hover:scale-110";

      return `
        <div class="relative flex items-center justify-center h-6 w-6 transition-all duration-300 ${ringGlow}">
          <span class="absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseClass}"></span>
          <span class="relative inline-flex rounded-full h-3.5 w-3.5 ${colorClass} border-2 border-darkBg shadow-[0_0_8px_currentColor]"></span>
        </div>
      `;
    };

    containers.forEach((c) => {
      const isSelected = selectedContainerId === c.id;
      const markerHtml = getMarkerHTML(c.nivelLlenado, c.estado, isSelected);

      const customIcon = L.divIcon({
        className: "custom-container-marker",
        html: markerHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      if (markersRef.current[c.id]) {
        const marker = markersRef.current[c.id];
        marker.setLatLng([c.lat, c.lng]);
        marker.setIcon(customIcon);
        if (isSelected) {
          marker.setZIndexOffset(1000);
        } else {
          marker.setZIndexOffset(0);
        }
      } else {
        const marker = L.marker([c.lat, c.lng], { icon: customIcon })
          .addTo(map)
          .on("click", () => {
            setSelectedContainerId(c.id);
            setSelectedCocheId(null);
          });
        markersRef.current[c.id] = marker;
      }
    });

    const storeIds = new Set(containers.map((c) => c.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!storeIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
  }, [containers, selectedContainerId, setSelectedContainerId, setSelectedCocheId]);

  // 3. Render and Animate Vehicle Fleet Markers (GET /api/coches)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    liveCoches.forEach((coche: LiveCochePosition) => {
      const isSelected = selectedCocheId === coche.idCoche;

      const vehicleMarkerHtml = `
        <div class="relative flex flex-col items-center group transition-transform duration-300 ${
          isSelected ? "scale-125 z-[2500]" : "hover:scale-110 z-[1500]"
        }">
          <!-- License plate badge -->
          <div class="bg-darkBg border border-accentPurp text-[9px] font-extrabold font-mono text-textPri px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1 mb-0.5 whitespace-nowrap">
            <span class="h-1.5 w-1.5 rounded-full bg-accentGreen animate-ping"></span>
            <span>${coche.placa}</span>
          </div>

          <!-- Metallic Truck Icon -->
          <div class="relative flex items-center justify-center h-8 w-8 bg-gradient-to-br from-accentPurp to-accentPurpLight text-white rounded-full border-2 border-white/80 shadow-[0_0_12px_rgba(124,58,237,0.7)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-4.2a1 1 0 0 0-.28-.7l-3.3-3.3a1 1 0 0 0-.7-.28H15v7.5A1.5 1.5 0 0 0 16.5 18z"/><circle cx="6.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-coche-marker",
        html: vehicleMarkerHtml,
        iconSize: [36, 42],
        iconAnchor: [18, 36],
      });

      if (cocheMarkersRef.current[coche.idCoche]) {
        const marker = cocheMarkersRef.current[coche.idCoche];
        marker.setLatLng([coche.lat, coche.lng]);
        marker.setIcon(customIcon);
      } else {
        const marker = L.marker([coche.lat, coche.lng], { icon: customIcon })
          .addTo(map)
          .on("click", () => {
            setSelectedCocheId(coche.idCoche);
            setSelectedContainerId(null);
          });

        cocheMarkersRef.current[coche.idCoche] = marker;
      }
    });
  }, [liveCoches, selectedCocheId, setSelectedCocheId, setSelectedContainerId]);

  // 4. Manage Operator Base Truck Marker (Draggable)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const truckIcon = L.divIcon({
      className: "truck-marker",
      html: `
        <div class="relative flex items-center justify-center h-8 w-8 bg-accentPurp/25 rounded-full border-2 border-accentPurp shadow-[0_0_12px_rgba(124,58,237,0.5)]">
          <div class="h-2 w-2 bg-accentPurp rounded-full animate-ping absolute"></div>
          <div class="h-4 w-4 bg-accentPurp text-white rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-2.5 w-2.5"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-4.2a1 1 0 0 0-.28-.7l-3.3-3.3a1 1 0 0 0-.7-.28H15v7.5A1.5 1.5 0 0 0 16.5 18z"/><circle cx="6.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (operatorMarkerRef.current) {
      operatorMarkerRef.current.setLatLng([
        operatorLocation.lat,
        operatorLocation.lng,
      ]);
    } else {
      const marker = L.marker([operatorLocation.lat, operatorLocation.lng], {
        icon: truckIcon,
        draggable: true,
        zIndexOffset: 2000,
      })
        .addTo(map)
        .on("dragend", (e: L.LeafletEvent) => {
          const m = e.target as L.Marker;
          const latlng = m.getLatLng();
          setOperatorLocation({ lat: latlng.lat, lng: latlng.lng });
        });

      operatorMarkerRef.current = marker;
    }
  }, [operatorLocation, setOperatorLocation]);

  // 5. Center Selected Container or Selected Vehicle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedContainerId) {
      const target = containers.find((c) => c.id === selectedContainerId);
      if (target) {
        map.setView([target.lat, target.lng], 15, { animate: true, duration: 1 });
      }
    } else if (selectedCocheId) {
      const targetCoche = liveCoches.find((c) => c.idCoche === selectedCocheId);
      if (targetCoche) {
        map.setView([targetCoche.lat, targetCoche.lng], 15, { animate: true, duration: 1 });
      }
    }
  }, [selectedContainerId, selectedCocheId, containers, liveCoches]);

  // 6. Draw Optimal Route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (optimalRoute && optimalRoute.path.length > 0) {
      const latlngs = optimalRoute.path;

      if (routePolylineRef.current) {
        routePolylineRef.current.setLatLngs(latlngs);
        routePolylineRef.current.addTo(map);
      } else {
        const polyline = L.polyline(latlngs, {
          color: "#7c3aed",
          weight: 4,
          opacity: 0.85,
          dashArray: "8, 6",
          lineJoin: "round",
        }).addTo(map);
        routePolylineRef.current = polyline;
      }

      const bounds = routePolylineRef.current.getBounds();
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else {
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
        routePolylineRef.current = null;
      }
    }
  }, [optimalRoute]);

  const handleRecolectionRoute = () => {
    if (routingMode === "recolect") {
      setRoutingMode("none");
    } else {
      setRoutingMode("recolect");
    }
  };

  const activeFullBinsCount = containers.filter(
    (c) => c.estado === "lleno"
  ).length;

  const selectedCoche = liveCoches.find((c) => c.idCoche === selectedCocheId);

  return (
    <div className="relative flex-1 h-full min-w-0">
      {/* Leaflet container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Loading Overlay Badge */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] glass-panel border-accentPurp/30 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-semibold text-textPri animate-slide-in">
          <RefreshCw className="h-3.5 w-3.5 text-accentPurp animate-spin" />
          <span>Cargando datos de sensores desde Azure...</span>
        </div>
      )}

      {/* Error Overlay Badge */}
      {isError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-accentRed/90 border border-accentRed text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 text-xs font-bold animate-slide-in">
          <AlertTriangle className="h-4 w-4" />
          <span>{error?.message || "Error de conexión con la API de sensores"}</span>
          {refetch && (
            <button
              onClick={() => refetch()}
              className="bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {/* Fleet Controls & Simulation Overlay (Top Right) */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        {/* Toggle Simulation Button for Vehicles */}
        <button
          onClick={toggleSimulatingVehicles}
          className="glass-panel border-panelBorder hover:border-accentPurp/40 text-textPri px-3 py-2 text-xs font-semibold rounded-lg shadow-xl flex items-center gap-2 transition-all"
        >
          {isSimulatingVehicles ? (
            <>
              <Pause className="h-4 w-4 text-accentOrange animate-pulse" />
              <span>Pausar simulación flota ({coches.length} vehículos)</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 text-accentGreen" />
              <span>Reanudar simulación flota ({coches.length} vehículos)</span>
            </>
          )}
        </button>

        {/* Optimize Route Button */}
        <button
          onClick={handleRecolectionRoute}
          disabled={activeFullBinsCount === 0}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg shadow-xl border select-none transition-all ${
            routingMode === "recolect"
              ? "bg-accentRed border-accentRed/30 text-white shadow-accentRed/10 hover:bg-accentRed/90"
              : "glass-panel border-panelBorder text-textPri hover:border-textSec/30 disabled:opacity-50 disabled:pointer-events-none"
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>
            {routingMode === "recolect"
              ? "Cancelar ruta recolección"
              : `Optimizar ruta (${activeFullBinsCount} llenos)`}
          </span>
        </button>

        {routingMode === "recolect" && isRoutingLoading && (
          <div className="glass-panel border-panelBorder p-3 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-slide-in min-w-[200px] text-textSec">
            <span className="h-3 w-3 rounded-full border-2 border-accentPurp border-t-transparent animate-spin" />
            Calculando ruta por calles reales...
          </div>
        )}

        {routingMode === "recolect" && !isRoutingLoading && optimalRoute && (
          <div className="glass-panel border-panelBorder p-3 rounded-lg shadow-xl text-xs flex flex-col gap-1.5 animate-slide-in min-w-[200px]">
            <div className="text-[10px] text-accentRed uppercase font-bold tracking-wider mb-0.5">
              Ruta de Recogida TSP
            </div>
            <div className="flex justify-between text-textSec">
              <span>Distancia total:</span>
              <span className="font-bold text-textPri font-mono">
                {optimalRoute.distance} km
              </span>
            </div>
            <div className="flex justify-between text-textSec">
              <span>Tiempo total:</span>
              <span className="font-bold text-textPri font-mono">
                {optimalRoute.duration} min
              </span>
            </div>
            <div className="text-[10px] text-textSec/70 mt-1 border-t border-panelBorder/30 pt-1.5 leading-normal">
              * Visitando los contenedores críticos por proximidad.
            </div>
          </div>
        )}
      </div>

      {/* Floating Card for Selected Vehicle (from GET /api/coches) */}
      {selectedCoche && (
        <div className="absolute top-4 left-16 z-[450] glass-panel border-accentPurp/40 p-4 rounded-xl shadow-2xl w-72 animate-slide-in text-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-panelBorder pb-2">
            <div className="flex items-center gap-2">
              <span className="bg-accentPurp/20 border border-accentPurp/40 text-accentPurpLight px-2 py-0.5 rounded font-mono font-black text-xs">
                {selectedCoche.placa}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-accentGreen font-bold bg-accentGreen/10 px-2 py-0.5 rounded-full border border-accentGreen/20">
                <ShieldCheck className="h-3 w-3" />
                <span>{selectedCoche.estadoCoche}</span>
              </span>
            </div>
            <button
              onClick={() => setSelectedCocheId(null)}
              className="text-textSec hover:text-textPri p-1 rounded hover:bg-panelBg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1 text-textSec">
            <div className="flex justify-between">
              <span>ID Vehículo (API):</span>
              <span className="font-mono text-textPri font-bold">Coche #{selectedCoche.idCoche}</span>
            </div>
            <div className="flex justify-between">
              <span>Capacidad de Carga:</span>
              <span className="font-mono text-textPri font-bold">{selectedCoche.capacidad} L</span>
            </div>
            <div className="flex justify-between">
              <span>Coordenadas GPS:</span>
              <span className="font-mono text-textPri text-[10px]">
                {selectedCoche.lat.toFixed(5)}, {selectedCoche.lng.toFixed(5)}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setOperatorLocation({ lat: selectedCoche.lat, lng: selectedCoche.lng });
              handleRecolectionRoute();
            }}
            className="w-full bg-accentPurp hover:bg-accentPurp/90 text-white font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow shadow-accentPurp/20 mt-1"
          >
            <Navigation className="h-3.5 w-3.5 fill-current" />
            <span>Asignar Ruta de Recolección</span>
          </button>
        </div>
      )}

      {/* Floating Instructions Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] glass-panel border-panelBorder/60 p-2.5 rounded-lg text-[10px] text-textSec max-w-xs shadow-md pointer-events-none">
        <div className="font-bold text-textPri mb-1 flex items-center gap-1">
          <Truck className="h-3 w-3 text-accentPurp" /> Simulación de Flota IoT
        </div>
        5 vehículos en vivo devueltos por <span className="font-mono text-accentPurpLight">GET /api/coches</span> patrullando las calles de La Paz en tiempo real.
      </div>

      {/* Floating Legend (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-[400] glass-panel border-panelBorder/80 px-3.5 py-2 rounded-lg flex items-center gap-4 text-[10px] font-semibold text-textSec shadow-lg select-none">
        <span className="text-[9px] uppercase font-bold text-textSec/80 mr-1">
          Leyenda:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accentPurp shadow-[0_0_6px_#7c3aed]" />
          <span>Vehículo / Coche</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accentRed shadow-[0_0_4px_#ef4444]" />
          <span>Lleno (&ge;85%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accentOrange shadow-[0_0_4px_#f59e0b]" />
          <span>Medio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accentGreen shadow-[0_0_4px_#22c55e]" />
          <span>Vacío (&lt;40%)</span>
        </div>
      </div>
    </div>
  );
};
