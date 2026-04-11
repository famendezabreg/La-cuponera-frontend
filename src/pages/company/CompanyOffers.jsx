import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const EMPTY_FORM = {
  title: "", regular_price: "", offer_price: "", description: "", details: "",
  image_url: "", coupon_per_user_limit: "",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "", limit_date: ""
};

const STATUS_BADGE = {
  Aprobada:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  Pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  Rechazada: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
};

export default function CompanyOffers() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [offers,      setOffers]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);

  // Imagen: "url" | "file"
  const [imageMode,   setImageMode]   = useState("url");
  const [imageFile,   setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Cupones: "unlimited" | "limited"
  const [couponMode,  setCouponMode]  = useState("unlimited");
  const [couponLimit, setCouponLimit] = useState("");

  const load = () => {
    setLoading(true);
    api.get("/company/offers")
      .then(res => setOffers(res.data))
      .catch(() => toast.error("Error al cargar ofertas"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.role !== "company_admin") { navigate("/offers"); return; }
    load();
  }, [user, navigate]);

  const resetImageState = () => {
    setImageMode("url");
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setCouponMode("unlimited");
    setCouponLimit("");
    resetImageState();
    setShowForm(true);
  };

  const openEdit = (o) => {
    setEditItem(o);
    setForm({
      title: o.title,
      regular_price: o.regular_price,
      offer_price: o.offer_price,
      description: o.description,
      details: o.details || "",
      image_url: o.image_url || "",
      coupon_per_user_limit: o.coupon_per_user_limit || "",
      start_date: o.start_date?.split("T")[0] || "",
      end_date:   o.end_date?.split("T")[0]   || "",
      limit_date: o.limit_date?.split("T")[0] || "",
    });
    setCouponMode(o.coupon_limit ? "limited" : "unlimited");
    setCouponLimit(o.coupon_limit || "");
    setImageMode("url");
    setImageFile(null);
    setImagePreview(o.image_url || null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditItem(null);
    setForm(EMPTY_FORM);
    setCouponMode("unlimited");
    setCouponLimit("");
    resetImageState();
  };

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Construir payload — si hay archivo usamos FormData, si no JSON
      let payload;
      let config = {};

      if (imageMode === "file" && imageFile) {
        payload = new FormData();
        // Campos básicos
        Object.entries(form).forEach(([k, v]) => {
          if (k !== "image_url" && v !== "") payload.append(k, v);
        });
        payload.append("image", imageFile);
        payload.append("coupon_limit", couponMode === "limited" ? couponLimit : "");
        config = { headers: { "Content-Type": "multipart/form-data" } };
      } else {
        payload = {
          ...form,
          image_url: imageMode === "url" ? form.image_url : "",
          coupon_limit: couponMode === "limited" ? couponLimit : null,
        };
      }

      if (editItem) {
        if (imageMode === "file" && imageFile) {
          // PATCH soporta multipart/form-data (PUT no lo hace)
          await api.patch(`/company/offers/${editItem.id}`, payload, config);
        } else {
          await api.put(`/company/offers/${editItem.id}`, payload);
        }
        toast.success("Oferta actualizada — enviada a revisión");
      } else {
        await api.post("/company/offers", payload, config);
        toast.success("Oferta creada — pendiente de aprobación");
      }
      closeForm();
      load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) Object.values(errors).flat().forEach(m => toast.error(m));
      else toast.error(err.response?.data?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (offer) => {
    if (!confirm(`¿Eliminar "${offer.title}"?`)) return;
    try {
      await api.delete(`/company/offers/${offer.id}`);
      toast.success("Oferta eliminada");
      load();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const formatMoney = (v) => new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(v);

  const inputCls = "w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans pb-20 transition-colors duration-300">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-extrabold text-white mb-2">
            Mis <span className="text-rose-400">Ofertas</span>
          </h1>
          <p className="text-slate-300">Gestiona las ofertas de tu empresa</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-500 dark:text-slate-400 text-sm">{offers.length} oferta(s)</p>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva oferta
          </button>
        </div>

        {/* ── Modal ─────────────────────────────────────────────────────── */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">
                  {editItem ? "Editar oferta" : "Nueva oferta"}
                </h3>

                <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3 mb-4">
                  ⚠️ Las nuevas ofertas quedan en estado <strong>Pendiente</strong> hasta ser aprobadas por el administrador.
                </p>

                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Título */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título de la oferta</label>
                    <input type="text" name="title" value={form.title} onChange={handleChange} className={inputCls} required />
                  </div>

                  {/* Precios */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precio regular ($)</label>
                    <input type="number" name="regular_price" value={form.regular_price} onChange={handleChange} step="0.01" min="0.01" className={inputCls} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precio oferta ($)</label>
                    <input type="number" name="offer_price" value={form.offer_price} onChange={handleChange} step="0.01" min="0.01" className={inputCls} required />
                  </div>

                  {/* Fechas */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha inicio</label>
                    <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className={inputCls} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha fin</label>
                    <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className={inputCls} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha límite canje</label>
                    <input type="date" name="limit_date" value={form.limit_date} onChange={handleChange} className={inputCls} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Límite por cliente (opcional)</label>
                    <input type="number" name="coupon_per_user_limit" value={form.coupon_per_user_limit} onChange={handleChange} min="1" placeholder="Sin límite" className={inputCls} />
                  </div>

                  {/* Toggle Ilimitado / Limitado */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cantidad de cupones</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => { setCouponMode("unlimited"); setCouponLimit(""); }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                          couponMode === "unlimited"
                            ? "bg-rose-500 text-white border-rose-500 shadow-md"
                            : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-rose-400"
                        }`}
                      >
                        ∞ Ilimitado
                      </button>
                      <button
                        type="button"
                        onClick={() => setCouponMode("limited")}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                          couponMode === "limited"
                            ? "bg-rose-500 text-white border-rose-500 shadow-md"
                            : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-rose-400"
                        }`}
                      >
                        # Limitado
                      </button>
                    </div>
                    {couponMode === "limited" && (
                      <div className="mt-3">
                        <input
                          type="number"
                          value={couponLimit}
                          onChange={e => setCouponLimit(e.target.value)}
                          min="1"
                          placeholder="Ej: 100"
                          className={inputCls}
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Imagen: URL o Archivo */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Imagen</label>
                    <div className="flex gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => { setImageMode("url"); setImageFile(null); setImagePreview(form.image_url || null); }}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          imageMode === "url"
                            ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent"
                            : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-slate-400"
                        }`}
                      >
                        🔗 URL web
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageMode("file")}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          imageMode === "file"
                            ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent"
                            : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-slate-400"
                        }`}
                      >
                        📁 Archivo local
                      </button>
                    </div>

                    {imageMode === "url" ? (
                      <input
                        type="url"
                        name="image_url"
                        value={form.image_url}
                        onChange={e => {
                          handleChange(e);
                          setImagePreview(e.target.value || null);
                        }}
                        placeholder="https://..."
                        className={inputCls}
                      />
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-700 hover:border-rose-400 transition-colors">
                        <svg className="w-8 h-8 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {imageFile ? imageFile.name : "Haz clic para subir una imagen (máx. 4 MB)"}
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    )}

                    {/* Preview */}
                    {imagePreview && (
                      <div className="mt-3 relative inline-block">
                        <img src={imagePreview} alt="Preview" className="h-24 rounded-xl object-cover border border-slate-200 dark:border-slate-600" />
                        <button
                          type="button"
                          onClick={() => { setImagePreview(null); setImageFile(null); setForm(p => ({ ...p, image_url: "" })); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 rounded-full text-white flex items-center justify-center text-xs font-bold hover:bg-rose-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Descripción */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                    <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                      className={inputCls} required />
                  </div>

                  {/* Detalles */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Detalles / Restricciones</label>
                    <textarea name="details" value={form.details} onChange={handleChange} rows={2} className={inputCls} />
                  </div>

                  {/* Botones */}
                  <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <button type="button" onClick={closeForm} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                    <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50">
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── Cards ─────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-slate-800 rounded-2xl h-48 border border-slate-100 dark:border-slate-700"></div>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🏷️</div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">No tenés ofertas aún</h3>
            <p className="text-slate-500 dark:text-slate-400">Creá tu primera oferta para que el administrador la apruebe.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map(offer => {
              const disc = Math.round(((offer.regular_price - offer.offer_price) / offer.regular_price) * 100);
              return (
                <div key={offer.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-lg transition-all">
                  {offer.image_url ? (
                    <img src={offer.image_url} alt={offer.title} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                      <svg className="w-12 h-12 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight flex-grow">{offer.title}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_BADGE[offer.status] || "bg-slate-100 text-slate-500"}`}>
                        {offer.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{offer.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-slate-400 line-through">{formatMoney(offer.regular_price)}</p>
                        <p className="text-lg font-black text-rose-600">{formatMoney(offer.offer_price)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold bg-rose-500 text-white px-2 py-1 rounded-lg">-{disc}%</span>
                        <p className="text-xs text-slate-400 mt-1">{offer.coupon_limit ? `${offer.coupon_limit} cupones` : "∞ Ilimitado"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(offer)} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(offer)} className="py-2 px-3 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
