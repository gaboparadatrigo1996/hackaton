/**
 * Configuración global de la API para WasteMap Frontend.
 * Exporta la URL base del backend desplegado en Azure desde import.meta.env.VITE_API_BASE_URL.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://backend-gestion-residuos-apcycsdueqf2dvb4.eastus-01.azurewebsites.net";
