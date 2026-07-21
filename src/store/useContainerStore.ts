import { create } from "zustand";
import type { Contenedor, NotificationItem } from "../types";
import type { CocheInfoDTO } from "../types/sensor";

export interface RouteInfo {
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
  fleetRoutes: Record<number, RouteInfo>; // Rutas individuales para CADA uno de los 5 camiones
  isRoutingLoading: boolean;

  // Flota de Coches (GET /api/coches)
  coches: CocheInfoDTO[];
  selectedCocheId: number | null;
  isSimulatingVehicles: boolean;

  // Actions
  setContainers: (containers: Contenedor[]) => void;
  updateContainer: (id: string, updates: Partial<Contenedor>) => void;
  setSelectedContainerId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterZona: (zona: string) => void;
  setFilterEstado: (estado: string) => void;
  setFilterTipo: (tipo: string) => void;
  addNotification: (
    notification: Omit<NotificationItem, "id" | "timestamp" | "read">
  ) => void;
  clearNotifications: () => void;
  dismissNotification: (id: string) => void;
  setRoutingMode: (
    mode: "none" | "single" | "recolect",
    targetId?: string | null
  ) => void;
  setOperatorLocation: (loc: { lat: number; lng: number }) => void;
  triggerRecogida: (id: string) => void;
  calculateRoute: () => Promise<void>;

  // Coche actions
  setCoches: (coches: CocheInfoDTO[]) => void;
  setSelectedCocheId: (id: number | null) => void;
  toggleSimulatingVehicles: () => void;
}

// Helper to calculate geographical distance (Haversine formula) in kilometers
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
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

// Servidor OSRM local/desplegado para cálculo de rutas reales sobre calles de Bolivia
const OSRM_BASE_URL = import.meta.env.VITE_OSRM_URL || "http://localhost:5000";
const OSRM_ROUTE_URL = `${OSRM_BASE_URL.replace(/\/+$/, "")}/route/v1/driving/`;


export interface RoadRouteResult {
  path: [number, number][];
  distance: number; // km
  duration: number; // min
}

const fetchRoadRoute = async (
  waypoints: [number, number][]
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
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
    );

    return {
      path,
      distance: parseFloat((route.distance / 1000).toFixed(2)),
      duration: Math.max(1, Math.round(route.duration / 60)),
    };
  } catch (error) {
    console.error("[Routing] No se pudo obtener la ruta real (OSRM):", error);
    return null;
  }
};

const buildFallbackRoute = (
  waypoints: [number, number][],
  extraMinutesPerStop = 0
): RoadRouteResult => {
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDistance += calculateDistance(
      waypoints[i][0],
      waypoints[i][1],
      waypoints[i + 1][0],
      waypoints[i + 1][1]
    );
  }

  const stopsCount = Math.max(0, waypoints.length - 2);
  const duration = Math.max(
    2,
    Math.round(totalDistance * 2 + 1 + stopsCount * extraMinutesPerStop)
  );

  return {
    path: waypoints,
    distance: parseFloat(totalDistance.toFixed(2)),
    duration,
  };
};

export const useContainerStore = create<ContainerState>((set, get) => ({
  containers: [],
  selectedContainerId: null,
  searchQuery: "",
  filterZona: "all",
  filterEstado: "all",
  filterTipo: "all",
  notifications: [],
  routingMode: "none",
  routingTargetId: null,
  operatorLocation: { lat: -16.512, lng: -68.128 },
  optimalRoute: null,
  fleetRoutes: {},
  isRoutingLoading: false,

  // Flota de Coches (GET /api/coches)
  coches: [],
  selectedCocheId: null,
  isSimulatingVehicles: true,

  setContainers: (containers) => set({ containers }),

  updateContainer: (id, updates) => {
    set((state) => {
      const nextContainers = state.containers.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          if (updates.nivelLlenado !== undefined) {
            updated.litrosActuales = Math.round(
              (updated.capacidadLitros * updated.nivelLlenado) / 100
            );

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
      const exists = state.notifications.some(
        (notif) =>
          notif.containerId === n.containerId &&
          !notif.read &&
          Date.now() - notif.timestamp.getTime() < 30000
      );
      if (exists) return {};

      const newNotif: NotificationItem = {
        ...n,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        read: false,
      };
      return { notifications: [newNotif, ...state.notifications].slice(0, 20) };
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
        Date.now() + 24 * 60 * 60 * 1000 * 2
      ).toISOString(),
      totalRecogidas:
        (get().containers.find((c) => c.id === id)?.totalRecogidas || 0) + 1,
    });
  },

  calculateRoute: async () => {
    const { routingMode, routingTargetId, operatorLocation, containers, coches } =
      get();

    if (routingMode === "none") {
      set({ optimalRoute: null, fleetRoutes: {}, isRoutingLoading: false });
      return;
    }

    set({ isRoutingLoading: true });

    if (routingMode === "single") {
      const target = containers.find((c) => c.id === routingTargetId);
      if (!target) {
        set({ optimalRoute: null, fleetRoutes: {}, isRoutingLoading: false });
        return;
      }

      // Encontrar el camión más cercano al contenedor seleccionado
      let assignedCoche = coches[0];
      let minDistance = Infinity;

      coches.forEach((coche) => {
        const dist = calculateDistance(coche.latitud, coche.longitud, target.lat, target.lng);
        if (dist < minDistance) {
          minDistance = dist;
          assignedCoche = coche;
        }
      });

      const startLoc: [number, number] = assignedCoche
        ? [assignedCoche.latitud, assignedCoche.longitud]
        : [operatorLocation.lat, operatorLocation.lng];

      const endLoc: [number, number] = [target.lat, target.lng];
      const roadRoute = await fetchRoadRoute([startLoc, endLoc]);

      if (
        get().routingMode !== "single" ||
        get().routingTargetId !== routingTargetId
      )
        return;

      const singleRoute = roadRoute ?? buildFallbackRoute([startLoc, endLoc]);
      const newFleetRoutes: Record<number, RouteInfo> = {};
      if (assignedCoche) {
        newFleetRoutes[assignedCoche.idCoche] = singleRoute;
      }

      set({
        optimalRoute: singleRoute,
        fleetRoutes: newFleetRoutes,
        isRoutingLoading: false,
      });
    } else if (routingMode === "recolect") {
      // Recolección multi-vehículo: Asignar TODOS los contenedores (o llenos/medios) entre TODOS los 5 camiones de la flota
      const targetContainers = containers.filter((c) => c.estado === "lleno" || c.estado === "medio");
      const activeContainers = targetContainers.length > 0 ? targetContainers : containers.slice(0, 10);

      const activeCoches = coches.length > 0 ? coches : [
        { idCoche: 1, placa: "ALTO-001", fechaRegistro: "", latitud: -16.5055, longitud: -68.1575, estadoCoche: "DISPONIBLE", capacidad: 400 },
        { idCoche: 2, placa: "LP-9988", fechaRegistro: "", latitud: -16.4954, longitud: -68.1332, estadoCoche: "DISPONIBLE", capacidad: 400 },
        { idCoche: 3, placa: "LPA9293", fechaRegistro: "", latitud: -16.487235, longitud: -68.140733, estadoCoche: "DISPONIBLE", capacidad: 400 },
        { idCoche: 4, placa: "LPA777", fechaRegistro: "", latitud: -16.489055, longitud: -68.147483, estadoCoche: "DISPONIBLE", capacidad: 400 },
        { idCoche: 6, placa: "RNA1234", fechaRegistro: "", latitud: -16.530701, longitud: -68.168427, estadoCoche: "DISPONIBLE", capacidad: 600 },
      ];

      // Mapear cada contenedor al camión más cercano
      const cocheAssignments: Map<number, Contenedor[]> = new Map();
      activeCoches.forEach((c) => cocheAssignments.set(c.idCoche, []));

      activeContainers.forEach((container) => {
        let closestCoche = activeCoches[0];
        let minD = Infinity;

        activeCoches.forEach((coche) => {
          const d = calculateDistance(coche.latitud, coche.longitud, container.lat, container.lng);
          if (d < minD) {
            minD = d;
            closestCoche = coche;
          }
        });

        cocheAssignments.get(closestCoche.idCoche)?.push(container);
      });

      // Calcular la ruta OSRM individual para CADA uno de los 5 camiones
      const newFleetRoutes: Record<number, RouteInfo> = {};

      const routePromises = activeCoches.map(async (coche) => {
        const assignedBins = cocheAssignments.get(coche.idCoche) || [];
        const startLoc: [number, number] = [coche.latitud, coche.longitud];

        // Ordenar paradas del camión con heurística TSP de vecino más cercano
        let currentLoc = startLoc;
        const unvisited = [...assignedBins];
        const orderedStops: [number, number][] = [];

        while (unvisited.length > 0) {
          let closestIndex = 0;
          let minDistance = Infinity;

          for (let i = 0; i < unvisited.length; i++) {
            const d = calculateDistance(
              currentLoc[0],
              currentLoc[1],
              unvisited[i].lat,
              unvisited[i].lng
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
        const roadRoute = await fetchRoadRoute(waypoints);
        const routeResult = roadRoute ?? buildFallbackRoute(waypoints, 2);

        newFleetRoutes[coche.idCoche] = routeResult;
      });

      await Promise.all(routePromises);

      if (get().routingMode !== "recolect") return;

      // Unificar estadísticas globales para resumen
      const totalDist = Object.values(newFleetRoutes).reduce((sum, r) => sum + r.distance, 0);
      const maxDuration = Math.max(...Object.values(newFleetRoutes).map((r) => r.duration), 0);

      set({
        optimalRoute: {
          path: newFleetRoutes[activeCoches[0]?.idCoche]?.path || [],
          distance: parseFloat(totalDist.toFixed(2)),
          duration: maxDuration,
        },
        fleetRoutes: newFleetRoutes,
        isRoutingLoading: false,
      });
    }
  },

  // Flota actions
  setCoches: (coches) => set({ coches }),
  setSelectedCocheId: (id) => set({ selectedCocheId: id }),
  toggleSimulatingVehicles: () =>
    set((state) => ({ isSimulatingVehicles: !state.isSimulatingVehicles })),
}));
