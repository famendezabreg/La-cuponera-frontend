import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./store/useAuthStore";

// Páginas públicas / cliente
import Login          from "./pages/Login";
import Register       from "./pages/Register";
import Offers         from "./pages/Offers";
import Coupons        from "./pages/Coupons";
import ChangePassword from "./pages/ChangePassword";
import Profile        from "./pages/Profile";
import Cart           from "./pages/Cart";

// Admin
import AdminDashboard  from "./pages/admin/AdminDashboard";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCompanies  from "./pages/admin/AdminCompanies";
import AdminClients    from "./pages/admin/AdminClients";
import AdminOffers     from "./pages/admin/AdminOffers";
import AdminEmployees  from "./pages/admin/AdminEmployees";
import AdminCoupons    from "./pages/admin/AdminCoupons";

// Admin de empresa
import CompanyOffers from "./pages/company/CompanyOffers";

// Empleado
import RedeemCoupon from "./pages/employee/RedeemCoupon";

/*
 * Guard de acceso por rol. Protege rutas que requieren un rol específico.
 *
 * Si el usuario no está logueado, redirige a "/" (login).
 * Si está logueado pero con un rol diferente al esperado, redirige a /offers.
 *
 * Se usa envolviendo el componente de la ruta:
 *   <RoleGuard user={user} roles={["admin"]}><AdminDashboard /></RoleGuard>
 */
function RoleGuard({ user, roles, children, fallback = "/offers" }) {
  if (!user) return <Navigate to="/" replace />;
  if (!roles.includes(user.role)) return <Navigate to={fallback} replace />;
  return children;
}

function App() {
  const checkAuth     = useAuthStore(state => state.checkAuth);
  const isCheckingAuth = useAuthStore(state => state.isCheckingAuth);
  const user           = useAuthStore(state => state.user);

  // Al montar la app, verifica si el token en localStorage sigue siendo válido.
  // Mientras verifica, muestra un spinner para evitar un flash de rutas incorrectas.
  useEffect(() => { checkAuth(); }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toaster global: muestra notificaciones de react-hot-toast en toda la app */}
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          {/* ── Públicas ─────────────────────────────────────── */}
          {/* Estas rutas no requieren autenticación */}
          <Route path="/"        element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/offers"  element={<Offers />} />

          {/* ── Cliente ──────────────────────────────────────── */}
          {/* Sin RoleGuard explícito; los propios componentes redirigen si no hay sesión */}
          <Route path="/coupons"         element={<Coupons />} />
          <Route path="/profile"         element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/cart"            element={<Cart />} />

          {/* ── Admin ────────────────────────────────────────── */}
          <Route path="/admin" element={
            <RoleGuard user={user} roles={["admin"]}>
              <AdminDashboard />
            </RoleGuard>
          } />
          <Route path="/admin/categories" element={
            <RoleGuard user={user} roles={["admin"]}>
              <AdminCategories />
            </RoleGuard>
          } />
          <Route path="/admin/companies" element={
            <RoleGuard user={user} roles={["admin"]}>
              <AdminCompanies />
            </RoleGuard>
          } />
          <Route path="/admin/clients" element={
            <RoleGuard user={user} roles={["admin"]}>
              <AdminClients />
            </RoleGuard>
          } />
          <Route path="/admin/offers" element={
            <RoleGuard user={user} roles={["admin"]}>
              <AdminOffers />
            </RoleGuard>
          } />
          <Route path="/admin/employees" element={
            <RoleGuard user={user} roles={["admin"]}>
              <AdminEmployees />
            </RoleGuard>
          } />
          <Route path="/admin/coupons" element={
            <RoleGuard user={user} roles={["admin"]}>
              <AdminCoupons />
            </RoleGuard>
          } />

          {/* ── Admin de empresa ─────────────────────────────── */}
          <Route path="/company/offers" element={
            <RoleGuard user={user} roles={["company_admin"]}>
              <CompanyOffers />
            </RoleGuard>
          } />

          {/* ── Empleado y company_admin (canjeo de cupones) ──── */}
          {/* company_admin también puede canjear cupones de su empresa */}
          <Route path="/employee/redeem" element={
            <RoleGuard user={user} roles={["employee", "company_admin"]}>
              <RedeemCoupon />
            </RoleGuard>
          } />

          {/* ── Fallback: cualquier ruta desconocida va a Offers ─ */}
          <Route path="*" element={<Navigate to="/offers" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
