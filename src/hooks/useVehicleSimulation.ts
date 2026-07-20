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
 * Hook para controlar la simulación simultánea de TODOS los camiones de la flota (GET /api/coches):
 * 1. Todos los camiones permanecen estáticos en sus coordenadas iniciales registradas en la API.
 * 2. Cuando se inicia la recolección (routingMode !== "none"), CADA UNO de los 5 camiones se desplaza
 *    SIMULTÁNEAMENTE a lo largo de su propia sub-ruta trazada por las calles.
 */
export function useVehicleSimulation() {
  const { coches, fleetRoutes, routingMode, containers, triggerRecogida } =
    useContainerStore();

  const [livePositions, setLivePositions] = useState<LiveCochePosition[]>([]);

  // Mantener el progreso del paso de animación para CADA UNO de los camiones de la flota
  const cocheProgressMapRef = useRef<Map<number, number>>(new Map());

  // 1. Inicializar o resetear la posición de todos los camiones al cambiar la flota o modo de ruta
  useEffect(() => {
    if (!coches || coches.length === 0) return;

    if (routingMode === "none" || !fleetRoutes || Object.keys(fleetRoutes).length === 0) {
      cocheProgressMapRef.current.clear();

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

    // Resetear el mapa de progreso de pasos para todos los vehículos activos
    coches.forEach((coche) => {
      cocheProgressMapRef.current.set(coche.idCoche, 0);
    });
  }, [coches, routingMode, fleetRoutes]);

  // 2. Bucle de animación simultánea para TODOS los camiones de la flota
  useEffect(() => {
    if (
      routingMode === "none" ||
      !fleetRoutes ||
      Object.keys(fleetRoutes).length === 0 ||
      coches.length === 0
    ) {
      return;
    }

    const interval = setInterval(() => {
      setLivePositions((prevPositions) => {
        const progressMap = cocheProgressMapRef.current;

        return prevPositions.map((cochePos) => {
          const vehicleRoute = fleetRoutes[cochePos.idCoche];

          // Si este camión no tiene ruta asignada o la ruta es muy corta, permanece estático
          if (!vehicleRoute || !vehicleRoute.path || vehicleRoute.path.length < 2) {
            return { ...cochePos, isMoving: false };
          }

          const routePath = vehicleRoute.path;
          const currentStep = progressMap.get(cochePos.idCoche) || 0;

          // Si llegó al final de su ruta individual
          if (currentStep >= routePath.length - 1) {
            return {
              ...cochePos,
              isMoving: false,
              currentStepIndex: routePath.length - 1,
              totalSteps: routePath.length,
            };
          }

          const nextStep = currentStep + 1;
          progressMap.set(cochePos.idCoche, nextStep);

          const currentPt = routePath[nextStep];
          const prevPt = routePath[currentStep];

          // Calcular ángulo de dirección / bearing del camión en la calle
          const dLat = currentPt[0] - prevPt[0];
          const dLng = currentPt[1] - prevPt[1];
          const bearing = (Math.atan2(dLng, dLat) * 180) / Math.PI;

          // Vaciar contenedores que se encuentren en la ruta de este camión
          containers.forEach((c) => {
            if (c.estado === "lleno" || c.estado === "medio") {
              const dist =
                Math.hypot(c.lat - currentPt[0], c.lng - currentPt[1]) * 111000;
              if (dist < 40) {
                triggerRecogida(c.id);
              }
            }
          });

          return {
            ...cochePos,
            lat: currentPt[0],
            lng: currentPt[1],
            bearing,
            isMoving: true,
            currentStepIndex: nextStep,
            totalSteps: routePath.length,
          };
        });
      });
    }, 450); // Avanza cada 450ms a lo largo de las rutas simultáneas

    return () => clearInterval(interval);
  }, [routingMode, fleetRoutes, coches, containers, triggerRecogida]);

  return livePositions;
}
