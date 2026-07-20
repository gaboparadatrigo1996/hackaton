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
