import type { Contenedor } from "../types";
import type {
  Sensor,
  ContenedorInfoDTO,
  ContenedorInfoMapaDTO,
  PuntoActivoContenedorDTO,
} from "../types/sensor";

/**
 * Regla de negocio para determinar el estado de la UI ("lleno" | "medio" | "vacio" | "mantenimiento")
 * a partir del nivelLlenado (%) y el estado del backend (MANTENIMIENTO / INACTIVO).
 *
 * Umbrales:
 * - Si backend estado === "MANTENIMIENTO" | "INACTIVO" => "mantenimiento"
 * - nivelLlenado >= 85% => "lleno"
 * - nivelLlenado 40% - 84% => "medio"
 * - nivelLlenado < 40% => "vacio"
 */
export function calculateEstado(
  nivelLlenado: number,
  backendEstado?: string
): "lleno" | "medio" | "vacio" | "mantenimiento" {
  if (backendEstado === "MANTENIMIENTO" || backendEstado === "INACTIVO") {
    return "mantenimiento";
  }
  if (nivelLlenado >= 85) {
    return "lleno";
  }
  if (nivelLlenado >= 40) {
    return "medio";
  }
  return "vacio";
}

// Direcciones de referencia en La Paz por zona para enriquecer la UI
const ADDRESSES_BY_ZONE: Record<string, string[]> = {
  Sopocachi: [
    "Av. 6 de Agosto / Plaza Abaroa",
    "Calle Belisario Salinas & Av. Arce",
    "Av. 20 de Octubre & Calle Aspiazu",
    "Calle Pedro Salazar / Sopocachi",
  ],
  Centro: [
    "Plaza San Francisco / Av. Mariscal Santa Cruz",
    "Calle Comercio & Socabaya",
    "Av. Camacho & Calle Bueno",
    "Plaza Murillo / Calle Bolivar",
  ],
  "Zona Sur": [
    "Av. Ballivián Calle 15 (Calacoto)",
    "Av. Hernando Siles Calle 8 (Obrajes)",
    "Calle 21 de Calacoto & Av. Inofuentes",
    "Av. Los Leones / Achumani",
  ],
  Cotahuma: [
    "Av. Buenos Aires / Pasaje Landaeta",
    "Av. Entre Ríos & Calle Tacna",
    "Plaza España / Tembladerani",
    "Av. Jaimes Freyre / Cotahuma",
  ],
};

function deriveZoneAndAddress(
  lat: number,
  lng: number,
  codigoMunicipal: string,
  index: number
): { zona: string; direccion: string } {
  let zona = "Centro";

  if (lat < -16.52) {
    zona = "Zona Sur";
  } else if (lat > -16.505 && lng < -68.125) {
    zona = "Sopocachi";
  } else if (lng < -68.150) {
    zona = "Cotahuma";
  } else if (lat > -16.510) {
    zona = "Centro";
  } else {
    zona = "Sopocachi";
  }

  const addresses = ADDRESSES_BY_ZONE[zona] || ADDRESSES_BY_ZONE["Centro"];
  const addressIndex = (index + (codigoMunicipal ? codigoMunicipal.charCodeAt(codigoMunicipal.length - 1) : 0)) % addresses.length;
  const direccion = addresses[addressIndex];

  return { zona, direccion };
}

const TIPOS_CONTENEDOR: ("General" | "Reciclaje" | "Orgánico" | "Vidrio")[] = [
  "General",
  "Reciclaje",
  "Orgánico",
  "Vidrio",
];

/**
 * Genera el historial semanal simulado consistente basado en el nivel actual.
 */
function generateHistorialSemanal(nivelActual: number, idNum: number) {
  const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  return dias.map((dia, idx) => {
    // Tendencia ascendente hasta el día actual
    const factor = (idx + 1) / 7;
    const base = Math.round(nivelActual * factor + ((idNum + idx * 7) % 15));
    return {
      dia,
      nivel: Math.min(100, Math.max(10, base)),
    };
  });
}

/**
 * Adapta los modelos DTO crudos del Backend API en Azure al tipo Contenedor que requiere la UI.
 */
export function mapBackendToContenedores(
  mapaList: ContenedorInfoMapaDTO[],
  puntosList: PuntoActivoContenedorDTO[] = [],
  sensoresList: Sensor[] = [],
  contenedoresList: ContenedorInfoDTO[] = []
): Contenedor[] {
  // Mapas auxiliares para búsqueda rápida
  const puntoMap = new Map<number, PuntoActivoContenedorDTO>();
  puntosList.forEach((p) => puntoMap.set(p.idContenedor, p));

  const sensorMap = new Map<number, Sensor>();
  sensoresList.forEach((s) => sensorMap.set(s.idSensor, s));

  const contenedorDtoMap = new Map<number, ContenedorInfoDTO>();
  contenedoresList.forEach((c) => contenedorDtoMap.set(c.idContenedor, c));

  return mapaList.map((mapaItem, index) => {
    const idContenedorNum = mapaItem.idContenedor;
    const punto = puntoMap.get(idContenedorNum);
    const sensorInfo = sensorMap.get(mapaItem.idSensor);
    const contenedorDto = contenedorDtoMap.get(idContenedorNum);

    const id = punto?.codigoMunicipal || contenedorDto?.codigoMunicipal || `LP-${String(idContenedorNum).padStart(3, "0")}`;
    const nombre = `Contenedor ${id}`;
    const capacidadLitros = punto?.capacidad || contenedorDto?.capacidad || 500;
    const nivelLlenado = mapaItem.nivelLlenado ?? 0;
    const litrosActuales = Math.round((capacidadLitros * nivelLlenado) / 100);

    const lat = mapaItem.latitud ?? punto?.latitud ?? -16.512;
    const lng = mapaItem.longitud ?? punto?.longitud ?? -68.128;

    const { zona, direccion } = deriveZoneAndAddress(lat, lng, id, index);

    // Tipo de contenedor
    const tipo = TIPOS_CONTENEDOR[index % TIPOS_CONTENEDOR.length];

    // Estado calculado según regla de negocio
    const backendEstado = sensorInfo?.estado || contenedorDto?.estado;
    const estado = calculateEstado(nivelLlenado, backendEstado);

    // Fechas de servicio
    const now = new Date();
    const ultimaRecogida = new Date(now.getTime() - (index % 3 + 1) * 24 * 60 * 60 * 1000).toISOString();
    const proximaRecogida = new Date(now.getTime() + (index % 2 + 1) * 24 * 60 * 60 * 1000).toISOString();
    const totalRecogidas = 12 + (index * 3) % 25;

    const historialSemanal = generateHistorialSemanal(nivelLlenado, idContenedorNum);

    return {
      id,
      nombre,
      direccion,
      zona,
      tipo,
      nivelLlenado,
      capacidadLitros,
      litrosActuales,
      estado,
      ultimaRecogida,
      proximaRecogida,
      totalRecogidas,
      historialSemanal,
      lat,
      lng,
    };
  });
}
