import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useContainerStore } from "../store/useContainerStore";
import {
  obtenerMapaContenedores,
  obtenerPuntosActivosContenedores,
  listarSensores,
  listarContenedores,
  listarCoches,
} from "../api/sensorService";
import { mapBackendToContenedores } from "../adapters/sensorAdapter";
import type { Contenedor } from "../types";

/**
 * Hook personalizado para sincronizar los datos en tiempo real de los sensores y coches del backend Azure.
 * Consume GET /api/coches y GET /api/asignacion/mapa usando @tanstack/react-query con refetchInterval.
 */
export function useRealtimeSensors() {
  const { setContainers, setCoches, addNotification } = useContainerStore();
  const prevContainersRef = useRef<Record<string, Contenedor>>({});
  const initialLoadedRef = useRef(false);

  const query = useQuery({
    queryKey: ["sensors-map-data"],
    queryFn: async () => {
      const [mapaList, puntosList, sensoresList, contenedoresList, cochesList] =
        await Promise.all([
          obtenerMapaContenedores(),
          obtenerPuntosActivosContenedores("ASIGNADO", 0, 50).catch(() => []),
          listarSensores(0, 50).catch(() => []),
          listarContenedores(0, 50).catch(() => []),
          listarCoches(0, 50).catch(() => []),
        ]);

      const containers = mapBackendToContenedores(
        mapaList,
        puntosList,
        sensoresList,
        contenedoresList
      );

      return { containers, coches: cochesList };
    },
    refetchInterval: 15000, // Refetch cada 15 segundos para tiempo real
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

  useEffect(() => {
    if (!query.data) return;

    const { containers: newContainers, coches: newCoches } = query.data;
    const prevMap = prevContainersRef.current;

    // Actualizar tienda Zustand con contenedores y coches reales de la API GET /api/coches
    setContainers(newContainers);
    if (newCoches && newCoches.length > 0) {
      setCoches(newCoches);
    }

    // Comparar estados anteriores vs nuevos para notificaciones en tiempo real
    newContainers.forEach((newContainer) => {
      const prev = prevMap[newContainer.id];

      if (!initialLoadedRef.current) {
        if (newContainer.nivelLlenado >= 85) {
          addNotification({
            containerId: newContainer.id,
            nombre: newContainer.nombre,
            direccion: newContainer.direccion,
            nivel: newContainer.nivelLlenado,
          });
        }
      } else if (prev) {
        if (prev.nivelLlenado < 85 && newContainer.nivelLlenado >= 85) {
          addNotification({
            containerId: newContainer.id,
            nombre: newContainer.nombre,
            direccion: newContainer.direccion,
            nivel: newContainer.nivelLlenado,
          });
        }
      }
    });

    initialLoadedRef.current = true;

    const newMap: Record<string, Contenedor> = {};
    newContainers.forEach((c) => {
      newMap[c.id] = c;
    });
    prevContainersRef.current = newMap;
  }, [query.data, setContainers, setCoches, addNotification]);

  return query;
}
