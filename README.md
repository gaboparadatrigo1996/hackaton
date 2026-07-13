# Hackaton Alcaldía — Gestión Inteligente de Contenedores de Residuos

Dashboard interactivo para el monitoreo y gestión de contenedores de residuos urbanos (IoT), con mapa en tiempo real, simulación de sensores y cálculo de rutas óptimas de recolección sobre calles reales.

## Características

- **Mapa interactivo** (Leaflet + CartoDB Dark Matter) con la ubicación de todos los contenedores, coloreados según su nivel de llenado y estado (lleno, medio, vacío, mantenimiento).
- **Simulación de sensores IoT** vía WebSocket mock, que actualiza el nivel de llenado de los contenedores periódicamente y genera notificaciones cuando un contenedor se vuelve crítico.
- **Rutas reales sobre calles**: el cálculo de rutas (individual o de recolección) usa el servicio de ruteo [OSRM](https://project-osrm.org/) para trazar el camino real siguiendo las vías, en lugar de líneas rectas.
- **Optimización de ruta de recolección (TSP)**: agrupa todos los contenedores llenos y calcula el orden de visita más corto mediante una heurística de vecino más cercano, mostrando distancia y tiempo estimado.
- **Panel de detalle** por contenedor con histórico semanal de llenado, fechas de recogida y acciones (registrar recogida, trazar ruta).
- **Simulación de camión recolector** arrastrable en el mapa, que recalcula las rutas al reubicar la base de operaciones.
- **Dashboard de métricas**: tarjetas resumen, gráficos de estado (dona), nivel por zona (barras) y llenado semanal.

## Stack técnico

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) como bundler
- [Zustand](https://github.com/pmndrs/zustand) para el estado global
- [Leaflet](https://leafletjs.com/) para el mapa
- [Recharts](https://recharts.org/) para las visualizaciones
- [Tailwind CSS](https://tailwindcss.com/) para estilos
- [OSRM](https://project-osrm.org/) (servidor público de demostración) para el cálculo de rutas reales

## Desarrollo local

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
npm run preview
```

## Notas

- El ruteo utiliza el servidor demo público de OSRM (`router.project-osrm.org`), pensado para pruebas. Para producción se recomienda un servidor OSRM propio o un proveedor con SLA garantizado (Mapbox Directions, GraphHopper, OpenRouteService, etc.).
- Los datos de contenedores son simulados (`src/data/mockContainers.ts`) y los eventos de sensores se generan localmente para fines de demostración.
