# WasteMap — Platform para Gestión Inteligente de Contenedores y Sensores IoT

Dashboard interactivo para el monitoreo y gestión de contenedores de residuos urbanos con datos consumidos en tiempo real desde el backend Spring Boot desplegado en Azure App Services.

## Integración Backend Azure (Real-Time API)

El frontend se conecta al backend real desplegado en Azure App Services:

- **Swagger UI**: [Documentación Interactiva Swagger](https://backend-gestion-residuos-apcycsdueqf2dvb4.eastus-01.azurewebsites.net/swagger-ui/index.html)
- **OpenAPI JSON Spec**: [Especificación v3 API Docs](https://backend-gestion-residuos-apcycsdueqf2dvb4.eastus-01.azurewebsites.net/v3/api-docs)

### Endpoints Consumidos
- `GET /api/sensor`: Muestra todos los sensores registrados (`sensor-controller`).
- `GET /api/sensor/estado/{estado}`: Filtra sensores por estado operativo.
- `PATCH /api/sensor/{id}/estado`: Modifica el estado operativo del sensor (SIN_ASIGNAR | ASIGNADO | INACTIVO | MANTENIMIENTO).
- `GET /api/contenedor`: Lista de contenedores con código municipal y capacidad.
- `GET /api/asignacion/mapa`: Retorna el mapeo de despliegue activo con coordenadas GPS (`latitud`, `longitud`) y nivel de llenado real (`nivelLlenado`).
- `GET /api/contenedor/por-estado/lista`: Retorna los puntos activos de contenedores desplegados con su número de serie de sensor.
- `GET /api/estadisticas/niveles-llenado`: Métricas de contenedores Llenos, Medios y Vacíos.
- `GET /api/estadisticas/estados-contenedor`: Distribución estadística por estados.

---

### Configuración CORS y Autenticación

#### Configuración de Variables de Entorno (`.env`)
```env
VITE_API_BASE_URL=https://backend-gestion-residuos-apcycsdueqf2dvb4.eastus-01.azurewebsites.net
VITE_API_TOKEN=tu_token_opcional_aqui
```

#### Requisito CORS en el Backend (Spring Boot / Azure)
Para evitar bloqueos por políticas de origen cruzado (CORS) en el navegador del usuario al realizar peticiones desde `http://localhost:5173` o el dominio de producción del frontend, se debe habilitar CORS en el backend Spring Boot de alguna de las siguientes formas:

1. **Anotación en Controllers**:
```java
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PATCH, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/api")
public class SensorController { ... }
```

2. **Configuración Global en Spring Security / WebMvcConfigurer**:
```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

---

## Características de la Aplicación

- **Integración API Real**: Reemplazo de datos mock por consumo directo del backend Azure mediante `axios` y `@tanstack/react-query`.
- **Actualización en Tiempo Real**: Polling optimizado cada 15s con React Query para refresco automático de mediciones y alertas.
- **Notificaciones Críticas**: Detección de transiciones de nivel a estado crítico (`≥85%`) con notificaciones visuales automáticas en la UI.
- **Mapa interactivo**: Leaflet + CartoDB Dark Matter centrado en La Paz con marcadores interactivos por estado.
- **Rutas reales sobre calles**: Cálculo de rutas (individual y TSP) utilizando el motor OSRM para seguir el trazado real de las vías.
- **Manejo de Carga y Errores**: Skeletons de carga, indicadores flotantes de sincronización y botones de reintento ante errores de red.

---

## Stack Técnico

- **Frontend**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Cliente HTTP**: Axios con interceptores de error y autorización.
- **State Management & Async Data**: [Zustand](https://github.com/pmndrs/zustand) & [@tanstack/react-query](https://tanstack.com/query/v5)
- **Mapas**: Leaflet + CartoDB Dark Matter
- **Gráficos**: Recharts
- **Estilos**: Tailwind CSS (Tema Dark/Glassmorphism)

---

## Desarrollo Local

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar servidor de desarrollo:
```bash
npm run dev
```

3. Construcción para producción:
```bash
npm run build
npm run preview
```

---

## Levantar OSRM en Local (PC con poca RAM - La Paz / El Alto)

Para calcular rutas reales sobre las calles de **La Paz y El Alto** en desarrollo local sin agotar la memoria en computadoras con recursos reducidos (ej. 6GB de RAM total), se utiliza un extracto de ciudad en lugar del mapa completo de Bolivia.

> **¿Por qué un extracto de ciudad?**  
> El archivo `.osm.pbf` de Bolivia completa pesa ~172MB y su procesamiento con `osrm-extract` y `osrm-partition` requiere más de 8GB de RAM, lo que provoca el colapso del sistema en equipos de 6GB RAM. Un extracto enfocado en La Paz/El Alto pesa **menos de 10MB** y se procesa consumiendo solo ~200-500MB de RAM.

---

### 1. Obtener o Recortar el Mapa de La Paz / El Alto

Tienes dos alternativas para obtener el archivo `la-paz.osm.pbf`:

#### Opción A: Descargar extracto recortado directo de BBBike Extract (Recomendado)
1. Ingresa a **[BBBike Extract](https://extract.bbbike.org/)** con las coordenadas de La Paz / El Alto:
   - **Formato**: Protocolbuffer Binary Format (`.pbf`)
   - **Bounding Box aproximado**: 
     - **Suroeste (SW)**: Latitud `-16.55`, Longitud `-68.20`
     - **Noreste (NE)**: Latitud `-16.45`, Longitud `-68.10`
   - **Enlace directo preconfigurado**: [BBBike Extract La Paz](https://extract.bbbike.org/?sw_lng=-68.20&sw_lat=-16.55&ne_lng=-68.10&ne_lat=-16.45&format=pbf)
2. Descarga el archivo generado y colócalo en `infra/osrm/data/la-paz.osm.pbf`.

#### Opción B: Recortar si ya tienes `bolivia-latest.osm.pbf` descargado
Si ya descargaste el mapa de Bolivia en `osrm/data/bolivia-latest.osm.pbf`, ejecuta el script automático de recorte:
```bash
npm run osrm:crop
```
*Este script utiliza `osmium` (a través de un contenedor Docker `stefda/osmium-tool` si no está instalado en el sistema) para recortar la región `-68.20,-16.55,-68.10,-16.45` y guardar el archivo liviano en `infra/osrm/data/la-paz.osm.pbf`.*

---

### 2. Preprocesamiento del Mapa con Límite de Memoria (2GB RAM)

Ejecuta el script de preprocesamiento configurado con un límite estricto de memoria (`--memory=2g`) y hilos limitados (`--threads 2`):

```bash
npm run osrm:setup
```

El script ejecutará los 3 pasos de OSRM en orden:
```bash
docker run --rm -t --memory=2g -v "${PWD}/infra/osrm/data:/data" osrm/osrm-backend \
  osrm-extract -p /opt/car.lua --threads 2 /data/la-paz.osm.pbf

docker run --rm -t --memory=2g -v "${PWD}/infra/osrm/data:/data" osrm/osrm-backend \
  osrm-partition /data/la-paz.osrm

docker run --rm -t --memory=2g -v "${PWD}/infra/osrm/data:/data" osrm/osrm-backend \
  osrm-customize /data/la-paz.osrm
```

---

### 3. Levantar el Servidor OSRM Local

Inicia el servicio en segundo plano (puerto `5000`):

```bash
npm run osrm:up
```

Comandos útiles:
* Ver registros: `npm run osrm:logs`
* Detener servicio: `npm run osrm:down`

---

### 4. Verificación del Servidor OSRM

Prueba que el servidor responda enviando una solicitud `curl` con las coordenadas de dos coches reales (`ALTO-001` y `LP-9988`):

```bash
curl "http://localhost:5000/route/v1/driving/-68.1575,-16.5055;-68.1332,-16.4954?overview=false"
```

Respuesta esperada:
```json
{"code":"Ok","routes":[{"geometry":"...","legs":[...],"weight_name":"routability","weight":...,"duration":...,"distance":...}],"waypoints":[...]}
```

---

### 5. Configuración del Backend y Aclaración de Entornos

#### Para el Frontend Local
En tu archivo `.env`, asegúrate de configurar:
```env
VITE_OSRM_URL=http://localhost:5000
```

#### Aclaración sobre el Endpoint `POST /api/coches/calcular` (Backend en la Nube vs Local)
* **Backend en Azure (Nube)**: El backend desplegado en `azurewebsites.net` realiza la petición a su propio servicio OSRM configurado en la nube. **No puede conectarse a `http://localhost:5000` de tu PC local**.
* **Prueba con Backend Local**: Para probar la planificación de flota (`POST /api/coches/calcular`) consumiendo tu OSRM local, debes ejecutar el servicio del backend en tu máquina local configurando el perfil local `application-local.properties`.

---

## Probar backend + OSRM local (end-to-end)

Para validar el flujo completo end-to-end de planificación de rutas en desarrollo local:

### 1. Iniciar OSRM Local (Puerto 5000)
```bash
npm run osrm:up
```

### 2. Levantar el Backend Spring Boot con Perfil Local (Puerto 8080)
Navega a la carpeta del proyecto backend (ubicado en `Descargas/sistema-gestion-residuos-main` o el directorio clonado del backend) y ejecuta:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

Este comando inicia Spring Boot cargando `application-local.properties`, el cual:
- Mantiene la conexión a la BD PostgreSQL en Render Cloud y Broker MQTT en HiveMQ Cloud.
- Conecta la optimización de rutas al OSRM local en `http://localhost:5000`.

### 3. Verificación End-to-End con `curl`

1. **Verificar lectura de vehículos desde la BD real de la nube**:
   ```bash
   curl -i http://localhost:8080/api/coches
   ```

2. **Ejecutar planificación de flota end-to-end consumiendo OSRM local**:
   ```bash
   curl -X POST http://localhost:8080/api/coches/calcular
   ```

   **Respuesta esperada (HTTP 200 OK sin error 500)**:
   ```json
   {
     "asignaciones": {
       "ALTO-001": ["1", "4"],
       "LP-9988": ["2", "3"]
     },
     "geometrias": {
       "ALTO-001": {
         "geometry": "polyline_encodificada_real...",
         "distance": 4820.5,
         "duration": 540.0
       }
     }
   }
   ```



