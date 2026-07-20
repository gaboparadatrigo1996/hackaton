import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useContainerStore } from "../store/useContainerStore";
import {
  obtenerMapaContenedores,
  obtenerPuntosActivosContenedores,
  listarSensores,
  listarContenedores,
} from "../api/sensorService";
import { mapBackendToContenedores } from "../adapters/sensorAdapter";
import type { Contenedor } from "../types";

/**
 * Hook personalizado para sincronizar los datos en tiempo real de los sensores del backend Azure.
 * Usa @tanstack/react-query con refetchInterval (polling cada 15s) para reflejar actualizaciones.
 * Compara estados anteriores vs nuevos para disparar notificaciones en tiempo real cuando un contenedor
 * alcanza nivel crítico (>= 85%).
 * 
 * NOTA SOBRE WEBSOCKET / SSE:
 * La especificación OpenAPI/Swagger actual del backend en Azure expone únicamente la API REST (GET /api/asignacion/mapa).
 * Se utiliza polling inteligente (15s) como mecanismo principal de tiempo real. Si en el futuro el backend expone
 * un endpoint WebSocket/SSE (ej: `wss://.../api/ws/sensores`), este hook puede suscribirse al canal y procesar
 * los eventos `container:update` para actualizar la tienda de Zustand sin requerir recargas periódicas.
 */
export function useRealtimeSensors() {
  const { setContainers, addNotification } = useContainerStore();
  const prevContainersRef = useRef<Record<string, Contenedor>>({});
  const initialLoadedRef = useRef(false);

  const query = useQuery({
    queryKey: ["sensors-map-data"],
    queryFn: async () => {
      const [mapaList, puntosList, sensoresList, contenedoresList] =
        await Promise.all([
          obtenerMapaContenedores(),
          obtenerPuntosActivosContenedores("ASIGNADO", 0, 50).catch(() => []),
          listarSensores(0, 50).catch(() => []),
          listarContenedores(0, 50).catch(() => []),
        ]);

      return mapBackendToContenedores(
        mapaList,
        puntosList,
        sensoresList,
        contenedoresList
      );
    },
    refetchInterval: 15000, // Refetch cada 15 segundos para tiempo real
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

  useEffect(() => {
    if (!query.data) return;

    const newContainers = query.data;
    const prevMap = prevContainersRef.current;

    // Actualizar tienda Zustand con los nuevos contenedores reales
    setContainers(newContainers);

    // Comparar estados anteriores vs nuevos para notificaciones en tiempo real
    newContainers.forEach((newContainer) => {
      const prev = prevMap[newContainer.id];

      if (!initialLoadedRef.current) {
        // En el primer recorrido, notificar si ya está en estado crítico (>=85%)
        if (newContainer.nivelLlenado >= 85) {
          addNotification({
            containerId: newContainer.id,
            nombre: newContainer.nombre,
            direccion: newContainer.direccion,
            nivel: newContainer.nivelLlenado,
          });
        }
      } else if (prev) {
        // En actualizaciones periódicas, si cruzó el umbral crítico (<85% -> >=85%)
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

    // Actualizar mapa de referencia anterior
    const newMap: Record<string, Contenedor> = {};
    newContainers.forEach((c) => {
      newMap[c.id] = c;
    });
    prevContainersRef.current = newMap;
  }, [query.data, setContainers, addNotification]);

  return query;
}
