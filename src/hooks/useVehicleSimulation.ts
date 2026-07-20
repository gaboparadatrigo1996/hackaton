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
  isMoving: boolean;
  currentStepIndex: number;
  totalSteps: number;
}

/**
 * Hook para controlar los vehículos devueltos por GET /api/coches:
 * 1. Los camiones permanecen estáticos en sus coordenadas iniciales de la API.
 * 2. ÚNICAMENTE cuando se traza/inicia una ruta (routingMode !== "none"), el vehículo asignado
 *    se desplaza en tiempo real siguiendo fielmente la polyline de la ruta trazada por las calles.
 */
export function useVehicleSimulation() {
  const { coches, optimalRoute, routingMode, containers, triggerRecogida } =
    useContainerStore();

  const [livePositions, setLivePositions] = useState<LiveCochePosition[]>([]);
  const routeProgressRef = useRef<{ stepIndex: number; routePath: [number, number][] }>({
    stepIndex: 0,
    routePath: [],
  });

  // 1. Sincronizar coches en su punto inicial registrado en la API GET /api/coches
  useEffect(() => {
    if (!coches || coches.length === 0) return;

    // Si no hay ruta activa, todos los camiones se ubican fijamente en su punto inicial
    if (routingMode === "none" || !optimalRoute || optimalRoute.path.length < 2) {
      routeProgressRef.current = { stepIndex: 0, routePath: [] };

      const staticPositions: LiveCochePosition[] = coches.map((coche) => ({
        idCoche: coche.idCoche,
        placa: coche.placa,
        lat: coche.latitud,
        lng: coche.longitud,
        estadoCoche: coche.estadoCoche,
        capacidad: coche.capacidad,
        bearing: 0,
        isMoving: false,
        currentStepIndex: 0,
        totalSteps: 0,
      }));

      setLivePositions(staticPositions);
      return;
    }

    // Cuando se inicia una ruta, asignamos la polyline trazada al primer vehículo (o el vehículo activo)
    routeProgressRef.current = {
      stepIndex: 0,
      routePath: optimalRoute.path,
    };
  }, [coches, routingMode, optimalRoute]);

  // 2. Animación en tiempo real a lo largo de la ruta trazada
  useEffect(() => {
    if (
      routingMode === "none" ||
      !optimalRoute ||
      optimalRoute.path.length < 2 ||
      coches.length === 0
    ) {
      return;
    }

    const path = optimalRoute.path;
    const interval = setInterval(() => {
      setLivePositions((prevPositions) => {
        const { stepIndex } = routeProgressRef.current;

        if (stepIndex >= path.length - 1) {
          // Llegó al final de la ruta trazada
          return prevPositions.map((pos, idx) =>
            idx === 0 ? { ...pos, isMoving: false } : pos
          );
        }

        const nextStepIndex = stepIndex + 1;
        routeProgressRef.current.stepIndex = nextStepIndex;

        const currentPt = path[nextStepIndex];
        const prevPt = path[stepIndex];

        // Calcular rumbo (bearing) para rotar el icono según el sentido de la calle
        const dLat = currentPt[0] - prevPt[0];
        const dLng = currentPt[1] - prevPt[1];
        const bearing = (Math.atan2(dLng, dLat) * 180) / Math.PI;

        // Comprobar si el camión pasa cerca de algún contenedor de la ruta para vaciarlo
        containers.forEach((c) => {
          if (c.estado === "lleno" || c.estado === "medio") {
            const dist =
              Math.hypot(c.lat - currentPt[0], c.lng - currentPt[1]) * 111000; // Distancia en metros aprox.
            if (dist < 40) {
              triggerRecogida(c.id);
            }
          }
        });

        return prevPositions.map((pos, idx) => {
          if (idx === 0) {
            // El camión asignado a la ruta avanza a la siguiente coordenada de la calle
            return {
              ...pos,
              lat: currentPt[0],
              lng: currentPt[1],
              bearing,
              isMoving: true,
              currentStepIndex: nextStepIndex,
              totalSteps: path.length,
            };
          }
          return pos;
        });
      });
    }, 400); // Avanza cada 400ms a lo largo de la polyline trazada

    return () => clearInterval(interval);
  }, [routingMode, optimalRoute, coches, containers, triggerRecogida]);

  return livePositions;
}
