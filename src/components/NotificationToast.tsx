import React, { useEffect } from "react";
import { useContainerStore } from "../store/useContainerStore";
import { X, AlertTriangle, MapPin } from "lucide-react";

export const NotificationToast: React.FC = () => {
  const { notifications, dismissNotification, setSelectedContainerId } =
    useContainerStore();

  // Auto-dismiss notification after 8 seconds
  useEffect(() => {
    if (notifications.length === 0) return;
    
    const newest = notifications[0];
    const timer = setTimeout(() => {
      dismissNotification(newest.id);
    }, 8000);

    return () => clearTimeout(timer);
  }, [notifications, dismissNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="pointer-events-auto w-full glass-panel border-accentRed/30 rounded-lg shadow-2xl p-4 flex gap-3 animate-slide-in relative overflow-hidden"
        >
          {/* Decorative red left-border glow */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-accentRed shadow-[0_0_10px_#ef4444]" />

          <div className="flex-shrink-0 text-accentRed pt-0.5">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-accentRed tracking-wider uppercase">
                Sensor Alerta · Crítico
              </p>
              <button
                onClick={() => dismissNotification(notif.id)}
                className="text-textSec hover:text-textPri p-1 rounded transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <h4 className="text-sm font-bold text-textPri truncate mt-1">
              {notif.nombre}
            </h4>
            <p className="text-xs text-textSec flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              {notif.direccion}
            </p>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-accentRed bg-accentRed/10 border border-accentRed/20 px-2 py-0.5 rounded">
                Capacidad: {notif.nivel}%
              </span>
              <button
                onClick={() => {
                  setSelectedContainerId(notif.containerId);
                  // Focus the camera on the container
                  // Set single route to it optionally
                  dismissNotification(notif.id);
                }}
                className="text-xs font-semibold text-textPri hover:text-accentPurp bg-panelBorder hover:bg-panelBorder/70 px-2.5 py-1 rounded transition-all flex items-center gap-1 border border-panelBorder"
              >
                Ver en mapa
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
