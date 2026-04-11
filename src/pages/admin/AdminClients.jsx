import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminLayout from "./AdminLayout";
import toast from "react-hot-toast";

const STATUS_BADGE = {
  available: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  redeemed:  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  expired:   "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
};
const STATUS_LABEL = { available: "Disponible", redeemed: "Canjeado", expired: "Vencido" };

export default function AdminClients() {
  const [clients,   setClients]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [selected,  setSelected]  = useState(null); // cliente activo
  const [coupons,   setCoupons]   = useState([]);
  const [loadingC,  setLoadingC]  = useState(false);

  useEffect(() => {
    api.get("/admin/clients")
      .then(res => setClients(res.data))
      .catch(() => toast.error("Error al cargar clientes"))
      .finally(() => setLoading(false));
  }, []);

  const openClient = async (client) => {
    setSelected(client);
    setLoadingC(true);
    try {
      const res = await api.get(`/admin/clients/${client.id}/coupons`);
      setCoupons(res.data.coupons || []);
    } catch {
      toast.error("No se pudieron cargar los cupones");
      setCoupons([]);
    } finally {
      setLoadingC(false);
    }
  };

  const filtered = clients.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email} ${c.dui}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("es-SV", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const formatMoney = (v) => new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(v ?? 0);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Clientes</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{clients.length} cliente(s) registrado(s)</p>
          </div>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 w-full sm:w-64"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Lista clientes */}
          <div className={`${selected ? "lg:col-span-2" : "lg:col-span-5"} bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden`}>
            {loading ? (
              <div className="p-8 text-center text-slate-400">Cargando...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                {search ? "No se encontraron resultados" : "No hay clientes registrados"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Nombre</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Email</th>
                      {!selected && <>
                        <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">DUI</th>
                        <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Teléfono</th>
                      </>}
                      <th className="text-center px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Cupones</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filtered.map(client => (
                      <tr
                        key={client.id}
                        onClick={() => openClient(client)}
                        className={`cursor-pointer transition-colors ${
                          selected?.id === client.id
                            ? "bg-rose-50 dark:bg-rose-900/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
                        }`}
                      >
                        <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {client.first_name} {client.last_name}
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 truncate max-w-[130px]">{client.email}</td>
                        {!selected && <>
                          <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-mono">{client.dui}</td>
                          <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{client.phone}</td>
                        </>}
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-bold">
                            {client.coupon_count ?? 0}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <svg className="w-4 h-4 text-slate-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Panel de cupones del cliente */}
          {selected && (
            <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">
                    {selected.first_name} {selected.last_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selected.email} · DUI: {selected.dui}</p>
                </div>
                <button
                  onClick={() => { setSelected(null); setCoupons([]); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4">
                {loadingC ? (
                  <div className="text-center py-8 text-slate-400">Cargando cupones...</div>
                ) : coupons.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-3xl mb-2">🎟️</div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Este cliente no tiene cupones adquiridos</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {coupons.map(c => (
                      <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                        <div className="flex-grow min-w-0">
                          <p className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">{c.code}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{c.offer_title}</p>
                          <p className="text-xs text-slate-400">{c.company_name} · Vence: {formatDate(c.expiration_date)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[c.status] || "bg-slate-100 text-slate-500"}`}>
                            {STATUS_LABEL[c.status] || c.status}
                          </span>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{formatMoney(c.offer_price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
