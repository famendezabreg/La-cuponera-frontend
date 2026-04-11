import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

/*
 * Store global de autenticación.
 *
 * Centraliza el estado de sesión: quién está logueado, si está autenticado,
 * y si todavía se está verificando el token al iniciar la app.
 *
 * El token se guarda en localStorage (no en el store) para que persista
 * entre recargas. El store solo guarda el objeto user y los flags de estado.
 *
 * Flujo de inicio de app:
 *   App.jsx llama checkAuth() → si hay token en localStorage, verifica con GET /api/user
 *   Si el servidor responde OK → setea user y isAuthenticated = true
 *   Si falla (token expirado) → limpia todo y redirige al login
 */
const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'), // true si hay token al iniciar
  isCheckingAuth: true, // evita renderizar rutas antes de verificar la sesión

  // Verifica si el token guardado sigue siendo válido. Se llama una vez al montar la app.
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isCheckingAuth: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      const res = await api.get('/user');
      set({ user: res.data, isAuthenticated: true, isCheckingAuth: false });
    } catch (error) {
      // Token inválido o expirado: limpiar sesión
      set({ user: null, isAuthenticated: false, isCheckingAuth: false, token: null });
      localStorage.removeItem('token');
    }
  },

  // Hace login, guarda el token en localStorage y actualiza el estado
  login: async (credentials) => {
    try {
      const res = await api.post('/login', credentials);
      const { user, token } = res.data;
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true });
      toast.success('Has iniciado sesión exitosamente');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
      return false;
    }
  },

  // Registro: crea la cuenta y loguea directamente (el backend devuelve token)
  register: async (userData) => {
    try {
      const res = await api.post('/register', userData);
      const { user, token } = res.data;
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true });
      toast.success('Cuenta creada exitosamente');
      return true;
    } catch (error) {
      if (error.response?.data?.errors) {
        // Laravel devuelve errores de validación como { errors: { campo: ['mensaje'] } }
        const errs = Object.values(error.response.data.errors).flat();
        errs.forEach(err => toast.error(err));
      } else {
        toast.error('Error al registrarse');
      }
      return false;
    }
  },

  // Cierra sesión localmente. La redirección la hace el Navbar.
  // No llama al backend porque la eliminación del token en el servidor
  // es opcional: con limpiar localStorage es suficiente para la sesión del frontend.
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
    toast.success('Sesión cerrada');
  }
}));

export default useAuthStore;
