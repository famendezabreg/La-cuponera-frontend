import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminLayout from "./AdminLayout";

const STAT_CARDS = [
  { key: "total_companies",  label: "Empresas",        color: "from-blue-500 to-blue-600",    icon: "🏢" },
  { key: "total_clients",    label: "Clientes",         color: "from-emerald-500 to-emerald-600", icon: "👥" },
  { key: "approved_offers",  label: "Ofertas Aprobadas",color: "from-rose-500 to-red-600",     icon: "🏷️" },
  { key: "pending_offers",   label: "Pendientes",       color: "from-amber-500 to-orange-500", icon: "⏳" },
  { key: "total_coupons",    label: "Cupones emitidos", color: "from-purple-500 to-purple-600",icon: "🎟️" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats")
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Resumen general de la plataforma</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-slate-800 rounded-2xl h-28 border border-slate-100 dark:border-slate-700"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {STAT_CARDS.map(card => (
              <div key={card.key} className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 text-white shadow-lg`}>
                <div className="text-3xl mb-2">{card.icon}</div>
                <p className="text-3xl font-black">{stats?.[card.key] ?? "—"}</p>
                <p className="text-sm text-white/80 mt-1 font-medium">{card.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Accesos rápidos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { to: "/admin/offers",    label: "Ver ofertas pendientes", icon: "⏳" },
              { to: "/admin/companies", label: "Gestionar empresas",     icon: "🏢" },
              { to: "/admin/clients",   label: "Ver clientes",           icon: "👥" },
              { to: "/admin/employees", label: "Gestionar empleados",    icon: "👤" },
            ].map(item => (
              <a
                key={item.to}
                href={item.to}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all text-center group"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                  {item.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
