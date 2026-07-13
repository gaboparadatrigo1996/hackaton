import { create } from "zustand";
import type { Contenedor, NotificationItem } from "../types";
import { initialContainers } from "../data/mockContainers";

interface RouteInfo {
  path: [number, number][];
  distance: number; // en km
  duration: number; // en minutos
}

interface ContainerState {
  containers: Contenedor[];
  selectedContainerId: string | null;
  searchQuery: string;
  filterZona: string;
  filterEstado: string;
  filterTipo: string;
  notifications: NotificationItem[];
  routingMode: "none" | "single" | "recolect";
  routingTargetId: string | null;
  operatorLocation: { lat: number; lng: number };
  optimalRoute: RouteInfo | null;
  isRoutingLoading: boolean;

  // Actions
  setContainers: (containers: Contenedor[]) => void;
  updateContainer: (id: string, updates: Partial<Contenedor>) => void;
  setSelectedContainerId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterZona: (zona: string) => void;
  setFilterEstado: (estado: string) => void;
  setFilterTipo: (tipo: string) => void;
  addNotification: (
    notification: Omit<NotificationItem, "id" | "timestamp" | "read">,
  ) => void;
  clearNotifications: () => void;
  dismissNotification: (id: string) => void;
  setRoutingMode: (
    mode: "none" | "single" | "recolect",
    targetId?: string | null,
  ) => void;
  setOperatorLocation: (loc: { lat: number; lng: number }) => void;
  triggerRecogida: (id: string) => void;
  calculateRoute: () => Promise<void>;
}

// Helper to calculate geographical distance (Haversine formula) in kilometers
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Public OSRM demo server: returns real driving directions that follow actual streets.
const OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving/";

interface RoadRouteResult {
  path: [number, number][];
  distance: number; // km
  duration: number; // min
}

// Requests a real, road-following route through an ordered list of waypoints ([lat, lng][]).
// Returns null if the routing service is unreachable or returns no route, so callers can fall back gracefully.
const fetchRoadRoute = async (
  waypoints: [number, number][],
): Promise<RoadRouteResult | null> => {
  if (waypoints.length < 2) return null;

  const coordsParam = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const url = `${OSRM_ROUTE_URL}${coordsParam}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.code !== "Ok" || !data.routes || data.routes.length === 0)
      return null;

    const route = data.routes[0];
    const path: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
    );

    return {
      path,
      distance: parseFloat((route.distance / 1000).toFixed(2)), // metros -> km
      duration: Math.max(1, Math.round(route.duration / 60)), // segundos -> minutos
    };
  } catch (error) {
    console.error("[Routing] No se pudo obtener la ruta real (OSRM):", error);
    return null;
  }
};

// Fallback when the routing service is unreachable: connects waypoints with straight segments
// so the app keeps working offline, but this is only used as a last resort.
const buildFallbackRoute = (
  waypoints: [number, number][],
  extraMinutesPerStop = 0,
): RoadRouteResult => {
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDistance += calculateDistance(
      waypoints[i][0],
      waypoints[i][1],
      waypoints[i + 1][0],
      waypoints[i + 1][1],
    );
  }

  const stopsCount = Math.max(0, waypoints.length - 2); // excluye origen y primer destino
  const duration = Math.max(
    2,
    Math.round(totalDistance * 2 + 1 + stopsCount * extraMinutesPerStop),
  );

  return {
    path: waypoints,
    distance: parseFloat(totalDistance.toFixed(2)),
    duration,
  };
};

export const useContainerStore = create<ContainerState>((set, get) => ({
  containers: initialContainers,
  selectedContainerId: null,
  searchQuery: "",
  filterZona: "all",
  filterEstado: "all",
  filterTipo: "all",
  notifications: [],
  routingMode: "none",
  routingTargetId: null,
  operatorLocation: { lat: -16.512, lng: -68.128 }, // Cerca de Sopocachi / Plaza Abaroa
  optimalRoute: null,
  isRoutingLoading: false,

  setContainers: (containers) => set({ containers }),

  updateContainer: (id, updates) => {
    set((state) => {
      const nextContainers = state.containers.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          // Auto adjustment of state based on level
          if (updates.nivelLlenado !== undefined) {
            updated.litrosActuales = Math.round(
              (updated.capacidadLitros * updated.nivelLlenado) / 100,
            );

            // If updating level, auto adjust status unless in maintenance
            if (c.estado !== "mantenimiento") {
              if (updated.nivelLlenado >= 85) {
                updated.estado = "lleno";
              } else if (updated.nivelLlenado >= 40) {
                updated.estado = "medio";
              } else {
                updated.estado = "vacio";
              }
            }
          }
          return updated;
        }
        return c;
      });

      // Recalculate route if container updates and routing is active
      setTimeout(() => {
        if (get().routingMode !== "none") {
          get().calculateRoute();
        }
      }, 0);

      return { containers: nextContainers };
    });
  },

  setSelectedContainerId: (id) => set({ selectedContainerId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterZona: (zona) => set({ filterZona: zona }),
  setFilterEstado: (estado) => set({ filterEstado: estado }),
  setFilterTipo: (tipo) => set({ filterTipo: tipo }),

  addNotification: (n) => {
    set((state) => {
      // Prevent duplicate active notifications for the same container if they are recent
      const exists = state.notifications.some(
        (notif) =>
          notif.containerId === n.containerId &&
          !notif.read &&
          Date.now() - notif.timestamp.getTime() < 30000,
      );
      if (exists) return {};

      const newNotif: NotificationItem = {
        ...n,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        read: false,
      };
      return { notifications: [newNotif, ...state.notifications].slice(0, 20) }; // Cap at 20
    });
  },

  clearNotifications: () => set({ notifications: [] }),

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  setRoutingMode: (mode, targetId = null) => {
    set({ routingMode: mode, routingTargetId: targetId });
    get().calculateRoute();
  },

  setOperatorLocation: (loc) => {
    set({ operatorLocation: loc });
    if (get().routingMode !== "none") {
      get().calculateRoute();
    }
  },

  triggerRecogida: (id) => {
    get().updateContainer(id, {
      nivelLlenado: 0,
      litrosActuales: 0,
      estado: "vacio",
      ultimaRecogida: new Date().toISOString(),
      proximaRecogida: new Date(
        Date.now() + 24 * 60 * 60 * 1000 * 2,
      ).toISOString(), // en 2 días
      totalRecogidas:
        (get().containers.find((c) => c.id === id)?.totalRecogidas || 0) + 1,
    });

    // Remove routing to this container if it was single route target
    if (get().routingMode === "single" && get().routingTargetId === id) {
      set({ routingMode: "none", routingTargetId: null, optimalRoute: null });
    } else if (get().routingMode === "recolect") {
      // Recalculate collection route since this container is no longer full
      get().calculateRoute();
    }
  },

  calculateRoute: async () => {
    const { routingMode, routingTargetId, operatorLocation, containers } =
      get();

    if (routingMode === "none") {
      set({ optimalRoute: null, isRoutingLoading: false });
      return;
    }

    const startLoc: [number, number] = [
      operatorLocation.lat,
      operatorLocation.lng,
    ];

    if (routingMode === "single") {
      const target = containers.find((c) => c.id === routingTargetId);
      if (!target) {
        set({ optimalRoute: null, isRoutingLoading: false });
        return;
      }

      const endLoc: [number, number] = [target.lat, target.lng];

      set({ isRoutingLoading: true });
      const roadRoute = await fetchRoadRoute([startLoc, endLoc]);

      // If routing mode changed while we were awaiting the request, discard this result
      if (
        get().routingMode !== "single" ||
        get().routingTargetId !== routingTargetId
      )
        return;

      set({
        optimalRoute: roadRoute ?? buildFallbackRoute([startLoc, endLoc]),
        isRoutingLoading: false,
      });
    } else if (routingMode === "recolect") {
      // Collect route: visit all "lleno" containers.
      const fullContainers = containers.filter((c) => c.estado === "lleno");

      if (fullContainers.length === 0) {
        set({ optimalRoute: null, isRoutingLoading: false });
        return;
      }

      // Order the stops with a Nearest Neighbor heuristic (TSP approximation) using
      // straight-line distance; the actual on-road path is then fetched from OSRM.
      let currentLoc = startLoc;
      const unvisited = [...fullContainers];
      const orderedStops: [number, number][] = [];

      while (unvisited.length > 0) {
        let closestIndex = 0;
        let minDistance = Infinity;

        for (let i = 0; i < unvisited.length; i++) {
          const d = calculateDistance(
            currentLoc[0],
            currentLoc[1],
            unvisited[i].lat,
            unvisited[i].lng,
          );
          if (d < minDistance) {
            minDistance = d;
            closestIndex = i;
          }
        }

        const nextStop = unvisited[closestIndex];
        const nextLoc: [number, number] = [nextStop.lat, nextStop.lng];
        orderedStops.push(nextLoc);
        currentLoc = nextLoc;
        unvisited.splice(closestIndex, 1);
      }

      const waypoints = [startLoc, ...orderedStops];

      set({ isRoutingLoading: true });
      const roadRoute = await fetchRoadRoute(waypoints);

      // If routing mode changed while we were awaiting the request, discard this result
      if (get().routingMode !== "recolect") return;

      set({
        optimalRoute: roadRoute ?? buildFallbackRoute(waypoints, 4),
        isRoutingLoading: false,
      });
    }
  },
}));
