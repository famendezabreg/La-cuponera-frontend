import axios from "axios";

/*
 * Instancia central de Axios para toda la app.
 *
 * En lugar de usar axios directamente en cada componente, todos los requests
 * pasan por aquí. Esto permite:
 *   - Configurar la base URL en un solo lugar (variable de entorno VITE_API_URL)
 *   - Adjuntar el token automáticamente sin repetir lógica
 *   - Manejar errores globales (como el 401) en un solo lugar
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api"
});

// Antes de cada request: agrega el Bearer token si existe en localStorage.
// Sanctum valida este token para identificar al usuario.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Después de cada respuesta: si el servidor devuelve 401 (token inválido o expirado),
// limpia el token del localStorage. El store de Zustand (useAuthStore) se encargará
// de actualizar el estado isAuthenticated cuando falle el checkAuth.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export default api;
