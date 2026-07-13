import { useEffect, useRef } from "react";
import { useContainerStore } from "../store/useContainerStore";

export const useContainerSensors = () => {
  const { containers, updateContainer, addNotification } = useContainerStore();
  const containersRef = useRef(containers);

  // Keep ref updated to avoid stale closure in interval
  useEffect(() => {
    containersRef.current = containers;
  }, [containers]);

  useEffect(() => {
    console.log("[WebSocket Mock] Conectado a canal de sensores: iot/residuos/lapaz/status");

    const interval = setInterval(() => {
      // Pick a random container to update
      const activeContainers = containersRef.current.filter(
        (c) => c.estado !== "mantenimiento" && c.nivelLlenado < 100
      );

      if (activeContainers.length === 0) return;

      const randomContainer = activeContainers[Math.floor(Math.random() * activeContainers.length)];
      
      // Increment fill level by 3% to 12%
      const increment = Math.floor(Math.random() * 10) + 3;
      const oldLevel = randomContainer.nivelLlenado;
      const newLevel = Math.min(100, oldLevel + increment);

      console.log(
        `[WebSocket Mock] Evento 'container:update' recibido para ${randomContainer.id}: Nivel ${oldLevel}% -> ${newLevel}%`
      );

      // Apply update
      updateContainer(randomContainer.id, { nivelLlenado: newLevel });

      // If it crossed the threshold to critical (>= 85%) and was previously below it, trigger a notification
      if (oldLevel < 85 && newLevel >= 85) {
        console.log(`[WebSocket Mock] ¡Alerta! Contenedor crítico detectado: ${randomContainer.id}`);
        addNotification({
          containerId: randomContainer.id,
          nombre: randomContainer.nombre,
          direccion: randomContainer.direccion,
          nivel: newLevel,
        });
      }
    }, 5000); // Cada 5 segundos

    return () => {
      clearInterval(interval);
      console.log("[WebSocket Mock] Desconectado del canal de sensores");
    };
  }, [updateContainer, addNotification]);
};
