import axios, { AxiosError } from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "../config/api";

type ApiErrorCallback = (error: { message: string; status?: number }) => void;
const errorListeners: Set<ApiErrorCallback> = new Set();

export const subscribeToApiErrors = (callback: ApiErrorCallback) => {
  errorListeners.add(callback);
  return () => {
    errorListeners.delete(callback);
  };
};

const notifyError = (message: string, status?: number) => {
  errorListeners.forEach((listener) => listener({ message, status }));
};

/**
 * Instancia de Axios configurada para consumir la API de Gestión de Residuos en Azure.
 */
export const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos de timeout
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor de Solicitud (Request Interceptor) - Inyección de Autenticación si existe Token
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      localStorage.getItem("AUTH_TOKEN") ||
      (import.meta.env.VITE_API_TOKEN as string | undefined);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor de Respuesta (Response Interceptor) - Manejo global de errores y toasts
httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    let errorMessage = "Error de conexión con la API de sensores.";
    const status = error.response?.status;

    if (error.response) {
      switch (status) {
        case 401:
          errorMessage = "No autorizado: Requiere credenciales de acceso.";
          break;
        case 403:
          errorMessage = "Acceso prohibido al recurso de la API.";
          break;
        case 404:
          errorMessage = "Recurso no encontrado en el servidor backend.";
          break;
        case 500:
          errorMessage = "Error interno del servidor backend Azure.";
          break;
        default:
          errorMessage = `Error del servidor (${status}).`;
      }
    } else if (error.request) {
      errorMessage =
        "La API backend no responde. Verifique su conexión o la configuración de CORS.";
    }

    console.error(`[API Error ${status || "NET_ERR"}]`, errorMessage, error);
    notifyError(errorMessage, status);

    return Promise.reject(error);
  }
);
