import { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import AdminLayout from "./AdminLayout";
import toast from "react-hot-toast";

const STATUS_TABS = [
  { key: "all",       label: "Todos",       color: "bg-slate-600" },
  { key: "available", label: "Disponibles", color: "bg-emerald-500" },
  { key: "redeemed",  label: "Canjeados",   color: "bg-blue-500" },
  { key: "expired",   label: "Vencidos",    color: "bg-rose-400" },
];

const STATUS_BADGE = {
  available: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  redeemed:  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  expired:   "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
};

const STATUS_LABEL = { available: "Disponible", redeemed: "Canjeado", expired: "Vencido" };

export default function AdminCoupons() {
  const [coupons,   setCoupons]   = useState([]);
  const [meta,      setMeta]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [status,    setStatus]    = useState("all");
  const [search,    setSearch]    = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page,      setPage]      = useState(1);

  const load = useCallback((st, q, pg) => {
    setLoading(true);
    const params = new URLSearchParams({ status: st, page: pg });
    if (q) params.set("search", q);
    api.get(`/admin/coupons?${params}`)
      .then(res => {
        setCoupons(res.data.data || []);
        setMeta(res.data.meta || res.data);
      })
      .catch(() => toast.error("Error al cargar cupones"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(status, search, page); }, [status, search, page, load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleStatusChange = (s) => { setStatus(s); setPage(1); };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("es-SV", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Cupones</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Registro global de todos los cupones emitidos</p>
        </div>

        {/* Barra de búsqueda */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar por código, oferta o empresa..."
            className="flex-grow border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors"
          >
            Buscar
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Limpiar
            </button>
          )}
        </form>

        {/* Tabs de estado */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleStatusChange(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                status === tab.key
                  ? `${tab.color} text-white shadow-md`
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Cargando...</div>
          ) : coupons.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">🎟️</div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {search ? `Sin resultados para "${search}"` : "No hay cupones en este estado"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    {["Código", "Oferta", "Empresa", "Cliente", "Estado", "Vence"].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {coupons.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {c.code}
                      </td>
                      <td className="px-5 py-3 text-slate-700 dark:text-slate-300 max-w-[160px] truncate">{c.offer_title}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{c.company_name}</td>
                      <td className="px-5 py-3">
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{c.client_name}</p>
                        <p className="text-xs text-slate-400">{c.client_email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[c.status] || "bg-slate-100 text-slate-500"}`}>
                          {STATUS_LABEL[c.status] || c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(c.expiration_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginación */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mostrando {meta.from}–{meta.to} de {meta.total} cupones
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <button
                disabled={page === meta.last_page}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
