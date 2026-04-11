import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";

/*
 * Barra de navegación. Se adapta según el rol del usuario autenticado.
 *
 * Si no hay sesión: muestra Ofertas + botón de login.
 * Si hay sesión: muestra los items del menú según el rol (ver menuItems).
 *
 * El ícono del carrito solo aparece para clientes y visitantes sin sesión,
 * ya que los otros roles no tienen funcionalidad de compra.
 */
function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false); // estado del menú móvil

  const logoutAction    = useAuthStore(s => s.logout);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const user            = useAuthStore(s => s.user);
  const cartItems       = useCartStore(s => s.items);
  // Suma las cantidades de todos los items para el badge del carrito
  const cartCount       = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const role = user?.role || null;

  const logout = () => {
    logoutAction();
    navigate("/offers"); // siempre redirige al catálogo al salir
    setOpen(false);
  };

  // Resalta el botón de la ruta activa (incluye subrutas)
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  // Botón de navegación reutilizable con estilos de activo/inactivo
  const NavButton = ({ title, path }) => (
    <button
      onClick={() => { navigate(path); setOpen(false); }}
      className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
        isActive(path)
          ? "text-rose-500 bg-rose-500/10"
          : "text-slate-300 hover:text-white hover:bg-white/10"
      }`}
    >
      {title}
    </button>
  );

  /*
   * Define los items del menú según el rol.
   * Cada rol ve solo las rutas a las que tiene acceso.
   */
  const menuItems = () => {
    if (!isAuthenticated) return [];

    if (role === "admin") {
      return [
        { title: "Dashboard", path: "/admin" },
        { title: "Empresas",  path: "/admin/companies" },
        { title: "Clientes",  path: "/admin/clients" },
        { title: "Ofertas",   path: "/admin/offers" },
        { title: "Empleados", path: "/admin/employees" },
      ];
    }

    if (role === "company_admin") {
      return [
        { title: "Mis ofertas",      path: "/company/offers" },
        { title: "Canjear cupón",    path: "/employee/redeem" },
        { title: "Ofertas públicas", path: "/offers" },
      ];
    }

    if (role === "employee") {
      return [
        { title: "Canjear cupón", path: "/employee/redeem" },
        { title: "Ofertas",       path: "/offers" },
      ];
    }

    // Cliente: catálogo, sus cupones, perfil y carrito
    return [
      { title: "Ofertas",     path: "/offers" },
      { title: "Mis cupones", path: "/coupons" },
      { title: "Mi perfil",   path: "/profile" },
      { title: cartCount > 0 ? `Carrito (${cartCount})` : "Carrito", path: "/cart" },
    ];
  };

  const items = menuItems();

  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-slate-900/90 backdrop-blur-md border-b border-white/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo: navega a la ruta principal del rol actual */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate(
              role === "admin"         ? "/admin"           :
              role === "company_admin" ? "/company/offers"  :
              role === "employee"      ? "/employee/redeem" :
              "/offers"
            )}
          >
            <div className="bg-gradient-to-tr from-rose-500 to-red-600 text-white p-2 rounded-xl shadow-lg shadow-rose-500/30 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">La Cuponera</h1>
              {/* Subtítulo de rol (no se muestra para clientes comunes) */}
              {role && role !== "client" && (
                <p className="text-xs text-slate-400 leading-none capitalize">
                  {role === "company_admin" ? "Admin Empresa" : role === "employee" ? "Empleado" : "Admin"}
                </p>
              )}
            </div>
          </div>

          {/* Menú desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {items.map(item => <NavButton key={item.path} title={item.title} path={item.path} />)}

            {/* Ícono de carrito con badge. Solo visible para clientes y visitantes */}
            {isAuthenticated && (!role || role === "client") && (
              <button
                onClick={() => navigate("/cart")}
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                title="Carrito"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            )}

            {isAuthenticated && (
              <>
                <div className="h-6 w-px bg-white/20 mx-2"></div>
                <button
                  onClick={logout}
                  className="ml-1 px-4 py-2 text-sm font-medium text-slate-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 hover:text-white transition-all duration-300 flex items-center space-x-2"
                >
                  <span>Salir</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            )}

            {/* Visitante sin sesión: acceso rápido a login */}
            {!isAuthenticated && (
              <>
                <NavButton title="Ofertas" path="/offers" />
                <button
                  onClick={() => navigate("/")}
                  className="ml-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 rounded-lg shadow-sm hover:from-rose-600 hover:to-red-700 transition-all duration-300"
                >
                  Iniciar sesión
                </button>
              </>
            )}
          </div>

          {/* Botón hamburguesa (móvil) */}
          <button
            className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
            onClick={() => setOpen(!open)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Menú móvil: se expande/colapsa con transición CSS */}
      <div className={`md:hidden absolute w-full bg-slate-900/95 backdrop-blur-md border-b border-white/10 transition-all duration-300 ease-in-out ${
        open ? "max-h-72 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
      } overflow-hidden`}>
        <div className="px-4 pt-2 pb-4 space-y-1 flex flex-col">
          {isAuthenticated ? (
            <>
              {items.map(item => <NavButton key={item.path} title={item.title} path={item.path} />)}
              <button
                onClick={logout}
                className="mt-2 w-full text-left px-4 py-2 text-sm font-medium text-rose-400 bg-rose-500/10 rounded-lg hover:bg-rose-500/20 transition-colors"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <NavButton title="Ofertas" path="/offers" />
              <button
                onClick={() => { navigate("/"); setOpen(false); }}
                className="mt-2 w-full text-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 rounded-lg"
              >
                Iniciar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
