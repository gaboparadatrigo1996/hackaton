import { useEffect, useState, useRef } from "react";
import { useContainerStore } from "../store/useContainerStore";

export interface LiveCochePosition {
  idCoche: number;
  placa: string;
  lat: number;
  lng: number;
  estadoCoche: string;
  capacidad: number;
  bearing: number;
}

// Genera un bucle de patrullaje / recorrido para cada vehículo alrededor de su ubicación inicial en La Paz
function generatePatrolWaypoints(baseLat: number, baseLng: number): [number, number][] {
  const delta = 0.0035; // Aproximadamente 350 metros de radio
  return [
    [baseLat, baseLng],
    [baseLat + delta, baseLng + delta * 0.8],
    [baseLat + delta * 1.5, baseLng - delta * 0.5],
    [baseLat + delta * 0.5, baseLng - delta * 1.5],
    [baseLat - delta * 0.8, baseLng - delta * 0.8],
    [baseLat - delta * 1.2, baseLng + delta * 0.4],
    [baseLat, baseLng],
  ];
}

/**
 * Hook para simular el movimiento en tiempo real de la flota de coches devueltos por GET /api/coches.
 * Interpola suavemente la posición GPS de cada vehículo a lo largo de su ruta de recolección.
 */
export function useVehicleSimulation() {
  const { coches, isSimulatingVehicles } = useContainerStore();
  const [livePositions, setLivePositions] = useState<LiveCochePosition[]>([]);
  
  const cocheRoutesRef = useRef<
    Map<
      number,
      {
        waypoints: [number, number][];
        currentWaypointIndex: number;
        stepProgress: number;
      }
    >
  >(new Map());

  useEffect(() => {
    if (!coches || coches.length === 0) return;

    const routesMap = cocheRoutesRef.current;
    
    coches.forEach((coche) => {
      if (!routesMap.has(coche.idCoche)) {
        routesMap.set(coche.idCoche, {
          waypoints: generatePatrolWaypoints(coche.latitud, coche.longitud),
          currentWaypointIndex: 0,
          stepProgress: 0,
        });
      }
    });

    const initialPositions: LiveCochePosition[] = coches.map((coche) => ({
      idCoche: coche.idCoche,
      placa: coche.placa,
      lat: coche.latitud,
      lng: coche.longitud,
      estadoCoche: coche.estadoCoche,
      capacidad: coche.capacidad,
      bearing: 45,
    }));

    setLivePositions(initialPositions);
  }, [coches]);

  useEffect(() => {
    if (!isSimulatingVehicles || coches.length === 0) return;

    const interval = setInterval(() => {
      setLivePositions((prevPositions) => {
        const routesMap = cocheRoutesRef.current;

        return prevPositions.map((cochePos) => {
          const routeState = routesMap.get(cochePos.idCoche);
          if (!routeState || routeState.waypoints.length < 2) return cochePos;

          let { currentWaypointIndex, stepProgress, waypoints } = routeState;

          stepProgress += 0.15;

          if (stepProgress >= 1) {
            stepProgress = 0;
            currentWaypointIndex = (currentWaypointIndex + 1) % (waypoints.length - 1);
          }

          routeState.stepProgress = stepProgress;
          routeState.currentWaypointIndex = currentWaypointIndex;

          const p1 = waypoints[currentWaypointIndex];
          const p2 = waypoints[currentWaypointIndex + 1];

          const currentLat = p1[0] + (p2[0] - p1[0]) * stepProgress;
          const currentLng = p1[1] + (p2[1] - p1[1]) * stepProgress;

          const dLat = p2[0] - p1[0];
          const dLng = p2[1] - p1[1];
          const bearing = (Math.atan2(dLng, dLat) * 180) / Math.PI;

          return {
            ...cochePos,
            lat: currentLat,
            lng: currentLng,
            bearing,
          };
        });
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isSimulatingVehicles, coches]);

  return livePositions;
}
