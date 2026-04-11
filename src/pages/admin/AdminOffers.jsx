import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminLayout from "./AdminLayout";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  Pendiente: { label: "Pendiente", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  Aprobada:  { label: "Aprobada",  badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  Rechazada: { label: "Rechazada", badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400" },
};

const FILTER_TABS = [
  { key: "Pendiente", label: "Pendientes",  icon: "🕐" },
  { key: "Aprobada",  label: "Aprobadas",   icon: "✅" },
  { key: "Rechazada", label: "Rechazadas",  icon: "❌" },
  { key: "all",       label: "Todas",       icon: "📋" },
];

export default function AdminOffers() {
  const [offers,     setOffers]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("Pendiente");
  const [viewMode,   setViewMode]   = useState("table"); // "table" | "cards"
  const [processing, setProcessing] = useState(null);

  const load = (status = filter) => {
    setLoading(true);
    api.get(`/admin/offers?status=${status}`)
      .then(res => setOffers(res.data.data || []))
      .catch(() => toast.error("Error al cargar ofertas"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

  const handleApprove = async (offer) => {
    setProcessing(offer.id + "-approve");
    try {
      await api.put(`/admin/offers/${offer.id}/approve`);
      toast.success(`✅ "${offer.title}" aprobada correctamente`);
      load(filter);
    } catch { toast.error("Error al aprobar"); }
    finally { setProcessing(null); }
  };

  const handleReject = async (offer) => {
    setProcessing(offer.id + "-reject");
    try {
      await api.put(`/admin/offers/${offer.id}/reject`);
      toast.success(`❌ "${offer.title}" rechazada`);
      load(filter);
    } catch { toast.error("Error al rechazar"); }
    finally { setProcessing(null); }
  };

  const handleRepublish = async (offer) => {
    setProcessing(offer.id + "-republish");
    try {
      await api.put(`/admin/offers/${offer.id}/republish`);
      toast.success(`🔄 "${offer.title}" enviada a revisión`);
      load(filter);
    } catch { toast.error("Error al republicar"); }
    finally { setProcessing(null); }
  };

  const handleDelete = async (offer) => {
    if (!confirm(`¿Eliminar "${offer.title}"?`)) return;
    try {
      await api.delete(`/admin/offers/${offer.id}`);
      toast.success("Oferta eliminada");
      load(filter);
    } catch { toast.error("Error al eliminar"); }
  };

  const formatMoney = (v) => new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(v);

  const ActionButtons = ({ offer, compact = false }) => (
    <div className={`flex items-center gap-2 ${compact ? "flex-wrap" : ""}`}>
      {offer.status !== "Aprobada" && (
        <button
          onClick={() => handleApprove(offer)}
          disabled={!!processing}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
        >
          {processing === offer.id + "-approve" ? "..." : "Aprobar"}
        </button>
      )}
      {offer.status !== "Rechazada" && (
        <button
          onClick={() => handleReject(offer)}
          disabled={!!processing}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/60 transition-colors disabled:opacity-50"
        >
          {processing === offer.id + "-reject" ? "..." : "Rechazar"}
        </button>
      )}
      {offer.status !== "Pendiente" && (
        <button
          onClick={() => handleRepublish(offer)}
          disabled={!!processing}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors disabled:opacity-50"
          title="Volver a poner en revisión"
        >
          {processing === offer.id + "-republish" ? "..." : "Re-publicar"}
        </button>
      )}
      <button
        onClick={() => handleDelete(offer)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Gestión de Ofertas</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Aprueba, rechaza o administra todas las ofertas de las empresas
            </p>
          </div>
          {/* Toggle vista */}
          <div className="flex bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
              </svg>
              Tabla
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "cards"
                  ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Tarjetas
            </button>
          </div>
        </div>

        {/* Filtros de estado */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === tab.key
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Vista TABLA ──────────────────────────────────────────── */}
        {viewMode === "table" && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Cargando...</div>
            ) : offers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  {filter === "Pendiente" ? "No hay ofertas pendientes" : "No hay ofertas en este estado"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      {["Empresa", "Oferta", "Precio", "Vence", "Estado", "Acciones"].map(h => (
                        <th key={h} className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {offers.map(offer => (
                      <tr key={offer.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{offer.company?.name || "—"}</p>
                          <p className="text-xs text-slate-400">{offer.company?.category?.name}</p>
                        </td>
                        <td className="px-5 py-4 max-w-[200px]">
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{offer.title}</p>
                          <p className="text-xs text-slate-400 truncate">{offer.description}</p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-xs text-slate-400 line-through">{formatMoney(offer.regular_price)}</p>
                          <p className="font-bold text-rose-600 dark:text-rose-400">{formatMoney(offer.offer_price)}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {offer.limit_date ? new Date(offer.limit_date).toLocaleDateString("es-SV") : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_CONFIG[offer.status]?.badge || "bg-slate-100 text-slate-500"}`}>
                            {STATUS_CONFIG[offer.status]?.label || offer.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <ActionButtons offer={offer} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Vista TARJETAS ───────────────────────────────────────── */}
        {viewMode === "cards" && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white dark:bg-slate-800 rounded-2xl h-64 border border-slate-100 dark:border-slate-700" />
                ))}
              </div>
            ) : offers.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-3">🏷️</div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No hay ofertas en este estado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {offers.map(offer => {
                  const disc = Math.round(((offer.regular_price - offer.offer_price) / offer.regular_price) * 100);
                  return (
                    <div key={offer.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col">
                      {/* Imagen */}
                      <div className="relative h-36 bg-slate-100 dark:bg-slate-700">
                        <img
                          src={offer.image_url || `https://picsum.photos/seed/${offer.id}/400/200`}
                          alt={offer.title}
                          className="w-full h-full object-cover"
                        />
                        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG[offer.status]?.badge}`}>
                          {offer.status}
                        </span>
                        <span className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">-{disc}%</span>
                      </div>

                      <div className="p-4 flex flex-col flex-grow">
                        <p className="text-xs font-semibold text-slate-400 mb-0.5">{offer.company?.name} · {offer.company?.category?.name}</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm line-clamp-1 mb-1">{offer.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 flex-grow">{offer.description}</p>

                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs text-slate-400 line-through">{formatMoney(offer.regular_price)}</p>
                            <p className="font-black text-rose-600 text-base">{formatMoney(offer.offer_price)}</p>
                          </div>
                          <div className="text-right text-xs text-slate-400">
                            <p>Vence: {offer.limit_date ? new Date(offer.limit_date).toLocaleDateString("es-SV") : "—"}</p>
                            <p>{offer.coupon_limit ? `${offer.coupon_limit} cupones` : "∞ Ilimitado"}</p>
                          </div>
                        </div>

                        <ActionButtons offer={offer} compact />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
