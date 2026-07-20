export * from "./types/sensor";

export interface Contenedor {
  id: string;              // "LP-001"
  nombre: string;           // "Contenedor LP-001"
  direccion: string;
  zona: string;             // "Centro", "Sopocachi", "Miraflores", "Zona Sur", etc.
  tipo: "General" | "Reciclaje" | "Orgánico" | "Vidrio";
  nivelLlenado: number;     // 0-100
  capacidadLitros: number;  // 500
  litrosActuales: number;
  estado: "lleno" | "medio" | "vacio" | "mantenimiento";
  ultimaRecogida: string;   // ISO date
  proximaRecogida: string;  // ISO date
  totalRecogidas: number;
  historialSemanal: { dia: string; nivel: number }[];
  lat: number;
  lng: number;
}

export interface NotificationItem {
  id: string;
  containerId: string;
  nombre: string;
  direccion: string;
  nivel: number;
  timestamp: Date;
  read: boolean;
}
