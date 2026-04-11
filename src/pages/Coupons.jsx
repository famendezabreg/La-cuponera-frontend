import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

const STATUS_TABS = [
  { key: "all",       label: "Todos",       color: "bg-slate-500" },
  { key: "available", label: "Disponibles", color: "bg-emerald-500" },
  { key: "redeemed",  label: "Canjeados",   color: "bg-blue-500" },
  { key: "expired",   label: "Vencidos",    color: "bg-rose-400" },
];

function statusLabel(status) {
  if (status === "available") return "Disponible";
  if (status === "redeemed")  return "Canjeado";
  if (status === "expired")   return "Vencido";
  return status;
}

function statusBadge(status) {
  if (status === "available") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400";
  if (status === "redeemed")  return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";
  if (status === "expired")   return "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400";
  return "bg-slate-100 text-slate-500";
}

function CouponCard({ coupon, onDownloadImage, onDownloadPDF, downloading }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("es-SV", {
      day: "2-digit", month: "short", year: "numeric"
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-red-600 px-5 py-4">
        <p className="text-white font-bold text-base leading-tight line-clamp-1">
          {coupon.offer?.company?.name || "Empresa"}
        </p>
        <p className="text-rose-100 text-sm line-clamp-1 mt-0.5">
          {coupon.offer?.title || "Oferta"}
        </p>
      </div>

      {/* Código */}
      <div className="px-5 pt-4 pb-2 flex-grow">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Código</p>
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-center">
          <p className="font-mono font-bold text-lg text-rose-600 tracking-widest break-all">
            {coupon.code}
          </p>
        </div>
        <div className="flex items-center justify-between mt-3 mb-4">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusBadge(coupon.status)}`}>
            {statusLabel(coupon.status)}
          </span>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Vence: {formatDate(coupon.expiration_date)}
          </p>
        </div>
      </div>

      {/* Botones de descarga — solo para disponibles */}
      {coupon.status === "available" && (
        <div className="px-5 pb-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => onDownloadImage(coupon)}
            disabled={downloading === coupon.id + "-img"}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
          >
            {downloading === coupon.id + "-img" ? (
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            PNG
          </button>
          <button
            onClick={() => onDownloadPDF(coupon)}
            disabled={downloading === coupon.id + "-pdf"}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all disabled:opacity-50"
          >
            {downloading === coupon.id + "-pdf" ? (
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            )}
            PDF
          </button>
        </div>
      )}
    </div>
  );
}

function Coupons() {
  const [coupons, setCoupons]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [activeTab, setActiveTab]   = useState("all");
  const [search,   setSearch]       = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }

    api.get("/my-coupons")
      .then(res => setCoupons(res.data.data || []))
      .catch(() => toast.error("No se pudieron cargar tus cupones."))
      .finally(() => setLoading(false));
  }, [navigate]);

  const buildCouponCanvas = (coupon) => {
    const W = 600, H = 320;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 24);
    ctx.fill();

    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, "#f43f5e");
    grad.addColorStop(1, "#dc2626");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, 90, [24, 24, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Arial, sans-serif";
    ctx.fillText(coupon.offer?.company?.name || "Empresa", 28, 38);

    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "16px Arial, sans-serif";
    ctx.fillText(coupon.offer?.title || "Oferta", 28, 68);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 12px Arial, sans-serif";
    ctx.fillText("CÓDIGO", 28, 122);

    ctx.strokeStyle = "#cbd5e1";
    ctx.setLineDash([8, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(24, 132, W - 48, 72, 12);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#f43f5e";
    ctx.font = "bold 28px Courier New, monospace";
    ctx.textAlign = "center";
    ctx.fillText(coupon.code, W / 2, 176);
    ctx.textAlign = "left";

    const isAvailable = coupon.status === "available";
    ctx.fillStyle = isAvailable ? "#d1fae5" : "#f1f5f9";
    ctx.beginPath();
    ctx.roundRect(24, 222, 130, 30, 15);
    ctx.fill();
    ctx.fillStyle = isAvailable ? "#059669" : "#64748b";
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.fillText(statusLabel(coupon.status), 40, 242);

    const fmt = (d) => d ? new Date(d).toLocaleDateString("es-SV", { day: "2-digit", month: "short", year: "numeric" }) : "—";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`Vence: ${fmt(coupon.expiration_date)}`, W - 24, 242);
    ctx.textAlign = "left";

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(1, 1, W - 2, H - 2, 24);
    ctx.stroke();

    return canvas;
  };

  const handleDownloadImage = async (coupon) => {
    setDownloading(coupon.id + "-img");
    try {
      const canvas = buildCouponCanvas(coupon);
      const link = document.createElement("a");
      link.download = `cupon-${coupon.code}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      toast.error("No se pudo descargar la imagen");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPDF = async (coupon) => {
    setDownloading(coupon.id + "-pdf");
    try {
      const canvas = buildCouponCanvas(coupon);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`cupon-${coupon.code}.pdf`);
    } catch {
      toast.error("No se pudo generar el PDF");
    } finally {
      setDownloading(null);
    }
  };

  const searchTerm = search.toLowerCase().trim();

  const filtered = coupons
    .filter(c => activeTab === "all" || c.status === activeTab)
    .filter(c => !searchTerm || (
      c.code?.toLowerCase().includes(searchTerm) ||
      c.offer?.title?.toLowerCase().includes(searchTerm) ||
      c.offer?.company?.name?.toLowerCase().includes(searchTerm)
    ));

  const counts = {
    all:       coupons.length,
    available: coupons.filter(c => c.status === "available").length,
    redeemed:  coupons.filter(c => c.status === "redeemed").length,
    expired:   coupons.filter(c => c.status === "expired").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans pb-20 transition-colors duration-300">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-900 via-slate-900 to-slate-900 opacity-60"></div>
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Mis <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-500">cupones</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-300">
            {loading ? "Cargando..." : `${counts.all} cupón${counts.all !== 1 ? "es" : ""} en total`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">

        {/* Barra de búsqueda */}
        {!loading && coupons.length > 0 && (
          <div className="relative mb-6 max-w-md mx-auto">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por código, oferta o empresa..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Tabs de estado */}
        {!loading && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab.key
                    ? `${tab.color} text-white shadow-md scale-105`
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {tab.label}
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key ? "bg-white/20" : "bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400"
                }`}>
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-slate-800 rounded-3xl h-56 shadow-sm border border-slate-100 dark:border-slate-700 p-5">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
                <div className="h-10 bg-slate-100 dark:bg-slate-700/50 rounded-xl mb-3"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Grid de cupones */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map(coupon => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                onDownloadImage={handleDownloadImage}
                onDownloadPDF={handleDownloadPDF}
                downloading={downloading}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-32">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 mb-6">
              <svg className="w-12 h-12 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            {coupons.length === 0 ? (
              <>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">No tenés cupones aún</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Explorá las ofertas disponibles y adquirí tu primer cupón.</p>
                <button
                  onClick={() => navigate("/offers")}
                  className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-lg shadow-rose-500/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Ver ofertas
                </button>
              </>
            ) : searchTerm ? (
              <>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Sin resultados</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">No se encontraron cupones que coincidan con <strong>"{search}"</strong>.</p>
                <button onClick={() => setSearch("")} className="text-rose-500 font-semibold hover:underline text-sm">
                  Limpiar búsqueda
                </button>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">No hay cupones en esta categoría</h3>
                <p className="text-slate-500 dark:text-slate-400">Seleccioná otra pestaña para ver tus cupones.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Coupons;
