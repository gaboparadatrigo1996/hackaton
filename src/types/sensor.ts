/**
 * Interfaz principal Sensor que coincide EXACTAMENTE con el modelo retornado por:
 * GET /api/sensor (sensor-controller: listar)
 * Schema Swagger: SensorInfoDTO
 */
export type EstadoSensor =
  | "SIN_ASIGNAR"
  | "ASIGNADO"
  | "INACTIVO"
  | "MANTENIMIENTO";

export interface Sensor {
  idSensor: number;
  numeroSerie: string;
  estado: EstadoSensor;
  fechaRegistro: string;
  fechaModificacion: string | null;
}

/**
 * Schema Swagger: SensorRegistroDTO (POST /api/sensor)
 */
export interface SensorRegistroDTO {
  numeroSerie: string;
}

/**
 * Modelo de datos retornado por GET /api/contenedor (contenedor-controller: listar)
 * Schema Swagger: ContenedorInfoDTO
 */
export type EstadoContenedor =
  | "SIN_ASIGNAR"
  | "ASIGNADO"
  | "INACTIVO"
  | "MANTENIMIENTO";

export interface ContenedorInfoDTO {
  idContenedor: number;
  codigoMunicipal: string;
  fechaRegistro: string;
  fechaModificion: string | null; // Nombre exacto del campo en Swagger backend
  capacidad: number;
  estado: EstadoContenedor;
}

/**
 * Schema Swagger: ContenedorRegistroDTO (POST /api/contenedor)
 */
export interface ContenedorRegistroDTO {
  codigoMunicipal: string;
  capacidad: number;
}

/**
 * Modelo de datos retornado por GET /api/asignacion/mapa (sensor-contenedor-controller: mostrarContenedoresConSensorDeplegadoMapa)
 * Schema Swagger: ContenedorInfoMapaDTO
 * 
 * RELACIÓN ENTRE ENTIDADES:
 * El modelo `Sensor` (SensorInfoDTO) contiene metadata del dispositivo IoT (idSensor, numeroSerie, estado).
 * No incluye nivel de llenado, dirección ni coordenadas geográficas.
 * Dichas métricas de telemetría y ubicación son provistas por la entidad de relación `ContenedorInfoMapaDTO`
 * (/api/asignacion/mapa) y `PuntoActivoContenedorDTO` (/api/contenedor/por-estado/lista?estado=ASIGNADO),
 * las cuales asocian `idSensor` + `idContenedor` con sus coordenadas (`latitud`, `longitud`) y `nivelLlenado` (%).
 */
export interface ContenedorInfoMapaDTO {
  idSensorContenedor: number;
  idContenedor: number;
  idSensor: number;
  latitud: number;
  longitud: number;
  nivelLlenado: number;
}

/**
 * Modelo de datos retornado por GET /api/contenedor/por-estado/lista?estado=ASIGNADO
 * Schema Swagger: PuntoActivoContenedorDTO
 */
export interface PuntoActivoContenedorDTO {
  idContenedor: number;
  codigoMunicipal: string;
  capacidad: number;
  idSensorContenedor: number;
  latitud: number;
  longitud: number;
  idSensor: number;
  numeroSerie: string;
}

/**
 * Modelo de detalle de asignación histórica de sensores por contenedor.
 * GET /api/contenedor/contenedor/{idContenedor}
 * Schema Swagger: SensorAsignadoDetalleDTO
 */
export interface SensorAsignadoDetalleDTO {
  idSensorContenedor: number;
  idSensor: number;
  fechaInicioAsignacion: string;
  fechaFinalizacionAsignacion: string | null;
  latitud: number;
  longitud: number;
  numeroSerie: string;
  estadoSensor: EstadoSensor;
  fechaRegistroSensor: string;
  fechaModificacionSensor: string | null;
}

/**
 * Schema Swagger: AsignacionRegistroDTO (POST /api/asignacion/asignar)
 */
export interface AsignacionRegistroDTO {
  idContenedor: number;
  idSensor: number;
  latitud: number;
  longitud: number;
  estado: "NO_DESPLEGADO" | "DESPLEGADO" | "FINALIZADO";
}

/**
 * Modelo de estadísticas por nivel de llenado.
 * GET /api/estadisticas/niveles-llenado
 * Schema Swagger: ContContenedorNivelDTO
 */
export interface ContContenedorNivelDTO {
  cantidadLleno: number;
  cantidadMedioLleno: number;
  cantidadVacio: number;
}

/**
 * Modelo de estadísticas por estados.
 * GET /api/estadisticas/estados-contenedor
 * Schema Swagger: ContContenedorEstados
 */
export interface ContContenedorEstados {
  SIN_ASIGNAR: number;
  ASIGNADO: number;
  MANTENIMIENTO: number;
  INACTIVO: number;
}

/**
 * Schema Swagger: LatLng
 */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * Modelo de ruta optimizada devuelta por POST /api/rutas/optimizar
 * Schema Swagger: RutaDTO
 */
export interface RutaDTO {
  polyline: string;
  distancia: number;
  duracion: number;
}

/**
 * Modelo de camiones / vehículos recolectores.
 * GET /api/coches
 * Schema Swagger: CocheInfoDTO
 */
export interface CocheInfoDTO {
  idCoche: number;
  placa: string;
  fechaRegistro: string;
  latitud: number;
  longitud: number;
  estadoCoche: "DISPONIBLE" | "NO_DISPONIBLE";
  capacidad: number;
}

/**
 * Schema Swagger: CocheRegistroDTO (POST /api/coches)
 */
export interface CocheRegistroDTO {
  placa: string;
  latitud: number;
  longitud: number;
  estadoCoche: "DISPONIBLE" | "NO_DISPONIBLE";
  capacidad: number;
}

/**
 * Schema Swagger: ResultadoPlanificacion (POST /api/coches/calcular)
 */
export interface ResultadoPlanificacion {
  asignaciones: Record<string, string[]>;
  geometrias: Record<string, RutaDTO>;
}
