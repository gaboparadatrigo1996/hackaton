import { httpClient } from "./httpClient";
import type {
  Sensor,
  SensorRegistroDTO,
  ContenedorInfoDTO,
  ContenedorRegistroDTO,
  ContenedorInfoMapaDTO,
  PuntoActivoContenedorDTO,
  SensorAsignadoDetalleDTO,
  AsignacionRegistroDTO,
  ContContenedorNivelDTO,
  ContContenedorEstados,
  RutaDTO,
  CocheInfoDTO,
  CocheRegistroDTO,
  ResultadoPlanificacion,
  EstadoSensor,
  EstadoContenedor,
  LatLng,
} from "../types/sensor";

/**
 * Servicio de datos que consume los endpoints REST reales desplegados en Azure.
 * Cada función documenta el método HTTP y la ruta de acceso real según Swagger UI.
 */

// ==========================================
// 1. SENSOR CONTROLLER (/api/sensor)
// ==========================================

/**
 * Muestra todos los sensores registrados en el sistema.
 * HTTP GET /api/sensor
 * Controller: sensor-controller
 * Query Params: page (default: 0), size (default: 50)
 */
export async function listarSensores(page = 0, size = 50): Promise<Sensor[]> {
  const { data } = await httpClient.get<Sensor[]>("/api/sensor", {
    params: { page, size },
  });
  return data;
}

/**
 * Registra un nuevo sensor IoT.
 * HTTP POST /api/sensor
 * Controller: sensor-controller
 * Request Body: SensorRegistroDTO
 */
export async function registrarSensor(
  sensorDto: SensorRegistroDTO
): Promise<void> {
  await httpClient.post("/api/sensor", sensorDto);
}

/**
 * Muestra los sensores filtrados por su estado.
 * HTTP GET /api/sensor/estado/{estado}
 * Controller: sensor-controller
 * Query Params: estado, numeroSerie, page, size
 */
export async function listarSensoresPorEstado(
  estado?: EstadoSensor,
  numeroSerie?: string,
  page = 0,
  size = 50
): Promise<Sensor[]> {
  const { data } = await httpClient.get<Sensor[]>(
    "/api/sensor/estado/" + (estado || ""),
    {
      params: { estado, numeroSerie, page, size },
    }
  );
  return data;
}

/**
 * Cambia el estado operativo de un sensor específico.
 * HTTP PATCH /api/sensor/{id}/estado
 * Controller: sensor-controller
 * Path Params: id (int64)
 * Query Params: estado (SIN_ASIGNAR | ASIGNADO | INACTIVO | MANTENIMIENTO)
 */
export async function cambiarEstadoSensor(
  id: number,
  estado: EstadoSensor
): Promise<void> {
  await httpClient.patch(`/api/sensor/${id}/estado`, null, {
    params: { estado },
  });
}

// ==========================================
// 2. CONTENEDOR CONTROLLER (/api/contenedor)
// ==========================================

/**
 * Muestra todos los contenedores registrados en la plataforma.
 * HTTP GET /api/contenedor
 * Controller: contenedor-controller
 * Query Params: page (default 0), size (default 50)
 */
export async function listarContenedores(
  page = 0,
  size = 50
): Promise<ContenedorInfoDTO[]> {
  const { data } = await httpClient.get<ContenedorInfoDTO[]>("/api/contenedor", {
    params: { page, size },
  });
  return data;
}

/**
 * Registra un contenedor por default (estado sin asignar).
 * HTTP POST /api/contenedor
 * Controller: contenedor-controller
 * Request Body: ContenedorRegistroDTO
 */
export async function registrarContenedor(
  contenedorDto: ContenedorRegistroDTO
): Promise<void> {
  await httpClient.post("/api/contenedor", contenedorDto);
}

/**
 * Cambia el estado operativo de un contenedor específico.
 * HTTP PATCH /api/contenedor/{id}/estado
 * Controller: contenedor-controller
 * Path Params: id (int64)
 * Query Params: estado (SIN_ASIGNAR | ASIGNADO | INACTIVO | MANTENIMIENTO)
 */
export async function cambiarEstadoContenedor(
  id: number,
  estado: EstadoContenedor
): Promise<void> {
  await httpClient.patch(`/api/contenedor/${id}/estado`, null, {
    params: { estado },
  });
}

/**
 * Muestra la lista de puntos de contenedores activos desplegados en el mapa con información del sensor asociado.
 * HTTP GET /api/contenedor/por-estado/lista
 * Controller: contenedor-controller
 * Query Params: estado (default "ASIGNADO"), page, size
 */
export async function obtenerPuntosActivosContenedores(
  estado: EstadoContenedor = "ASIGNADO",
  page = 0,
  size = 50
): Promise<PuntoActivoContenedorDTO[]> {
  const { data } = await httpClient.get<PuntoActivoContenedorDTO[]>(
    "/api/contenedor/por-estado/lista",
    {
      params: { estado, page, size },
    }
  );
  return data;
}

/**
 * Muestra los contenedores registrados filtrados por estado o código municipal.
 * HTTP GET /api/contenedor/estado/{estado}
 * Controller: contenedor-controller
 * Query Params: estado, codigoMunicipal, page, size
 */
export async function listarContenedoresPorEstado(
  estado?: EstadoContenedor,
  codigoMunicipal?: string,
  page = 0,
  size = 50
): Promise<ContenedorInfoDTO[]> {
  const { data } = await httpClient.get<ContenedorInfoDTO[]>(
    "/api/contenedor/estado/" + (estado || ""),
    {
      params: { estado, codigoMunicipal, page, size },
    }
  );
  return data;
}

/**
 * Muestra los sensores asignados históricamente a un contenedor específico.
 * HTTP GET /api/contenedor/contenedor/{idContenedor}
 * Controller: contenedor-controller
 * Path Params: idContenedor
 */
export async function obtenerSensoresPorContenedor(
  idContenedor: number,
  page = 0,
  size = 50
): Promise<SensorAsignadoDetalleDTO[]> {
  const { data } = await httpClient.get<SensorAsignadoDetalleDTO[]>(
    `/api/contenedor/contenedor/${idContenedor}`,
    {
      params: { page, size },
    }
  );
  return data;
}

// ==========================================
// 3. SENSOR-CONTENEDOR CONTROLLER (/api/asignacion)
// ==========================================

/**
 * Asigna un sensor al contenedor o un contenedor al sensor.
 * HTTP POST /api/asignacion/asignar
 * Controller: sensor-contenedor-controller
 * Request Body: AsignacionRegistroDTO
 */
export async function asignarSensorContenedor(
  asignacionDto: AsignacionRegistroDTO
): Promise<string> {
  const { data } = await httpClient.post<string>(
    "/api/asignacion/asignar",
    asignacionDto
  );
  return data;
}

/**
 * Muestra las asignaciones activas de sensores a contenedores desplegados en el mapa,
 * incluyendo coordenadas (latitud, longitud) y el nivel de llenado en tiempo real.
 * HTTP GET /api/asignacion/mapa
 * Controller: sensor-contenedor-controller
 */
export async function obtenerMapaContenedores(): Promise<ContenedorInfoMapaDTO[]> {
  const { data } = await httpClient.get<ContenedorInfoMapaDTO[]>("/api/asignacion/mapa");
  return data;
}

// ==========================================
// 4. RUTA CONTROLLER (/api/rutas)
// ==========================================

/**
 * Solicita al backend la optimización de una ruta de recolección para un arreglo de puntos GPS.
 * HTTP POST /api/rutas/optimizar
 * Controller: ruta-controller
 * Request Body: Array<LatLng>
 */
export async function optimizarRutaBackend(
  puntos: LatLng[]
): Promise<RutaDTO> {
  const { data } = await httpClient.post<RutaDTO>("/api/rutas/optimizar", puntos);
  return data;
}

// ==========================================
// 5. COCHE CONTROLLER (/api/coches)
// ==========================================

/**
 * Muestra todos los vehículos o coches recolectores registrados.
 * HTTP GET /api/coches
 * Controller: coche-controller
 */
export async function listarCoches(page = 0, size = 50): Promise<CocheInfoDTO[]> {
  const { data } = await httpClient.get<CocheInfoDTO[]>("/api/coches", {
    params: { page, size },
  });
  return data;
}

/**
 * Registra un coche recolector.
 * HTTP POST /api/coches
 * Controller: coche-controller
 * Request Body: CocheRegistroDTO
 */
export async function registrarCoche(
  cocheDto: CocheRegistroDTO
): Promise<void> {
  await httpClient.post("/api/coches", cocheDto);
}

/**
 * Calcula la planificación y asignación de rutas para la flota de coches recolectores.
 * HTTP POST /api/coches/calcular
 * Controller: coche-controller
 */
export async function calcularPlanificacionCoches(): Promise<ResultadoPlanificacion> {
  const { data } = await httpClient.post<ResultadoPlanificacion>(
    "/api/coches/calcular"
  );
  return data;
}

// ==========================================
// 6. ESTADISTICAS CONTROLLER (/api/estadisticas)
// ==========================================

/**
 * Muestra el resumen estadístico de contenedores por nivel de llenado (Lleno, Medio, Vacío).
 * HTTP GET /api/estadisticas/niveles-llenado
 * Controller: estadisticas-controller
 */
export async function obtenerEstadisticasNiveles(): Promise<ContContenedorNivelDTO> {
  const { data } = await httpClient.get<ContContenedorNivelDTO>(
    "/api/estadisticas/niveles-llenado"
  );
  return data;
}

/**
 * Muestra el resumen estadístico de contenedores por estado operativo.
 * HTTP GET /api/estadisticas/estados-contenedor
 * Controller: estadisticas-controller
 */
export async function obtenerEstadisticasEstados(): Promise<ContContenedorEstados> {
  const { data } = await httpClient.get<ContContenedorEstados>(
    "/api/estadisticas/estados-contenedor"
  );
  return data;
}
