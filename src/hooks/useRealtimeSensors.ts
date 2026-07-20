import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useContainerStore } from "../store/useContainerStore";
import {
  obtenerMapaContenedores,
  obtenerPuntosActivosContenedores,
  listarSensores,
  listarContenedores,
  listarCoches,
  obtenerEstadisticasNiveles,
  obtenerEstadisticasEstados,
} from "../api/sensorService";
import { mapBackendToContenedores } from "../adapters/sensorAdapter";
import type { Contenedor } from "../types";

/**
 * Hook personalizado para sincronizar los datos en tiempo real consumiendo los 6 controladores
 * y todos los endpoints expuestos en la API Swagger de Azure:
 * - sensor-controller (GET /api/sensor)
 * - contenedor-controller (GET /api/contenedor, GET /api/contenedor/por-estado/lista)
 * - sensor-contenedor-controller (GET /api/asignacion/mapa)
 * - coche-controller (GET /api/coches)
 * - estadisticas-controller (GET /api/estadisticas/niveles-llenado, GET /api/estadisticas/estados-contenedor)
 */
export function useRealtimeSensors() {
  const { setContainers, setCoches, addNotification } = useContainerStore();
  const prevContainersRef = useRef<Record<string, Contenedor>>({});
  const initialLoadedRef = useRef(false);

  const query = useQuery({
    queryKey: ["sensors-map-data-full"],
    queryFn: async () => {
      const [
        mapaList,
        puntosList,
        sensoresList,
        contenedoresList,
        cochesList,
        estadisticasNiveles,
        estadisticasEstados,
      ] = await Promise.all([
        obtenerMapaContenedores(),
        obtenerPuntosActivosContenedores("ASIGNADO", 0, 50).catch(() => []),
        listarSensores(0, 50).catch(() => []),
        listarContenedores(0, 50).catch(() => []),
        listarCoches(0, 50).catch(() => []),
        obtenerEstadisticasNiveles().catch(() => null),
        obtenerEstadisticasEstados().catch(() => null),
      ]);

      const containers = mapBackendToContenedores(
        mapaList,
        puntosList,
        sensoresList,
        contenedoresList
      );

      return {
        containers,
        coches: cochesList,
        estadisticasNiveles,
        estadisticasEstados,
      };
    },
    refetchInterval: 15000, // Polling cada 15 segundos para actualización en tiempo real
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

  useEffect(() => {
    if (!query.data) return;

    const { containers: newContainers, coches: newCoches } = query.data;
    const prevMap = prevContainersRef.current;

    // Actualizar la tienda con los datos reales del backend
    setContainers(newContainers);
    if (newCoches && newCoches.length > 0) {
      setCoches(newCoches);
    }

    // Monitorear niveles críticos (>= 85%) para generar alertas visuales
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
