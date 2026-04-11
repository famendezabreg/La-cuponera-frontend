import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminLayout from "./AdminLayout";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  name: "", code: "", address: "", contact_name: "",
  phone: "", email: "", commission_percentage: "", category_id: ""
};

const STATUS_BADGE = {
  Aprobada:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  Pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  Rechazada: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
};

const inputCls = "w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer";

export default function AdminCompanies() {
  const [companies,     setCompanies]     = useState([]);
  const [categories,    setCategories]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [editItem,      setEditItem]      = useState(null);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [saving,        setSaving]        = useState(false);

  // Panel de ofertas de empresa
  const [selectedCompany,  setSelectedCompany]  = useState(null);
  const [companyOffers,    setCompanyOffers]    = useState([]);
  const [offersLoading,    setOffersLoading]    = useState(false);
  const [offerAction,      setOfferAction]      = useState(null); // id del que está procesando

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/admin/companies"),
      api.get("/admin/categories"),
    ]).then(([c, cat]) => {
      setCompanies(c.data);
      setCategories(cat.data);
    }).catch(() => toast.error("Error al cargar"))
    .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // ── Formulario empresa ──────────────────────────────────────────
  const openCreate = () => { setEditItem(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit   = (c) => {
    setEditItem(c);
    setForm({
      name: c.name, code: c.code, address: c.address, contact_name: c.contact_name,
      phone: c.phone, email: c.email, commission_percentage: c.commission_percentage,
      category_id: c.category_id
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditItem(null); setForm(EMPTY_FORM); };
  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/admin/companies/${editItem.id}`, form);
        toast.success("Empresa actualizada");
      } else {
        await api.post("/admin/companies", form);
        toast.success("Empresa creada");
      }
      closeForm();
      load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) Object.values(errors).flat().forEach(msg => toast.error(msg));
      else toast.error(err.response?.data?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (company) => {
    if (!confirm(`¿Eliminar "${company.name}"? Se eliminarán sus ofertas.`)) return;
    try {
      await api.delete(`/admin/companies/${company.id}`);
      toast.success("Empresa eliminada");
      if (selectedCompany?.id === company.id) setSelectedCompany(null);
      load();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  // ── Panel de ofertas ────────────────────────────────────────────
  const openOffersPanel = async (company) => {
    setSelectedCompany(company);
    setOffersLoading(true);
    try {
      const res = await api.get(`/admin/companies/${company.id}/offers`);
      setCompanyOffers(res.data);
    } catch {
      toast.error("Error al cargar ofertas");
    } finally {
      setOffersLoading(false);
    }
  };

  const handleDeleteOffer = async (offer) => {
    if (!confirm(`¿Eliminar la oferta "${offer.title}"?`)) return;
    setOfferAction(offer.id + "-del");
    try {
      await api.delete(`/admin/offers/${offer.id}`);
      toast.success("Oferta eliminada");
      setCompanyOffers(prev => prev.filter(o => o.id !== offer.id));
      load(); // refresh offers_count
    } catch {
      toast.error("No se pudo eliminar");
    } finally {
      setOfferAction(null);
    }
  };

  const handleRepublishOffer = async (offer) => {
    setOfferAction(offer.id + "-rep");
    try {
      await api.put(`/admin/offers/${offer.id}/republish`);
      toast.success(`"${offer.title}" enviada a revisión`);
      setCompanyOffers(prev =>
        prev.map(o => o.id === offer.id ? { ...o, status: "Pendiente" } : o)
      );
    } catch {
      toast.error("No se pudo republicar");
    } finally {
      setOfferAction(null);
    }
  };

  const formatMoney = (v) => new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(v);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Empresas</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{companies.length} empresa(s) registrada(s)</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva empresa
          </button>
        </div>

        {/* ── Modal formulario empresa ──────────────────────────────── */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                  {editItem ? "Editar empresa" : "Nueva empresa"}
                </h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: "name",         label: "Nombre",             type: "text"   },
                    { name: "code",         label: "Código",             type: "text"   },
                    { name: "contact_name", label: "Nombre de contacto", type: "text"   },
                    { name: "email",        label: "Email",              type: "email"  },
                    { name: "phone",        label: "Teléfono",           type: "text"   },
                    { name: "address",      label: "Dirección",          type: "text"   },
                    { name: "commission_percentage", label: "Comisión (%)", type: "number" },
                  ].map(field => (
                    <div key={field.name} className={field.name === "address" ? "md:col-span-2" : ""}>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{field.label}</label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={form[field.name]}
                        onChange={handleChange}
                        className={inputCls}
                        required
                        step={field.name === "commission_percentage" ? "0.01" : undefined}
                        min={field.name === "commission_percentage" ? "0" : undefined}
                        max={field.name === "commission_percentage" ? "100" : undefined}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rubro</label>
                    <select name="category_id" value={form.category_id} onChange={handleChange} className={inputCls} required>
                      <option value="">Seleccionar rubro</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <button type="button" onClick={closeForm} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      Cancelar
                    </button>
                    <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50">
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── Layout dividido: tabla + panel de ofertas ──────────── */}
        <div className={`flex gap-5 transition-all duration-300 ${selectedCompany ? "flex-col xl:flex-row" : ""}`}>

          {/* Tabla */}
          <div className={selectedCompany ? "xl:w-[55%]" : "w-full"}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate-400">Cargando...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                      <tr>
                        {["Nombre", "Código", "Rubro", "Contacto", "Ofertas", ""].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {companies.map(company => (
                        <tr
                          key={company.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                            selectedCompany?.id === company.id ? "bg-rose-50/50 dark:bg-rose-900/10" : ""
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{company.name}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{company.code}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{company.category?.name || "—"}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{company.contact_name}</td>
                          <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">{company.offers_count ?? 0}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Ver Ofertas */}
                              <button
                                onClick={() => selectedCompany?.id === company.id ? setSelectedCompany(null) : openOffersPanel(company)}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                  selectedCompany?.id === company.id
                                    ? "bg-rose-500 text-white"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-600"
                                }`}
                                title="Ver ofertas de esta empresa"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                                Ofertas
                              </button>
                              {/* Editar */}
                              <button onClick={() => openEdit(company)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              {/* Eliminar */}
                              <button onClick={() => handleDelete(company)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ── Panel lateral de ofertas de empresa ──────────────── */}
          {selectedCompany && (
            <div className="xl:w-[45%]">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                {/* Header del panel */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{selectedCompany.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{companyOffers.length} oferta(s)</p>
                  </div>
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Lista de ofertas */}
                <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[480px] overflow-y-auto">
                  {offersLoading ? (
                    <div className="p-8 text-center text-slate-400 text-sm">Cargando ofertas...</div>
                  ) : companyOffers.length === 0 ? (
                    <div className="p-10 text-center">
                      <div className="text-3xl mb-2">🏷️</div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Esta empresa no tiene ofertas aún</p>
                    </div>
                  ) : (
                    companyOffers.map(offer => {
                      const disc = Math.round(((offer.regular_price - offer.offer_price) / offer.regular_price) * 100);
                      const isProcessing = offerAction?.startsWith(offer.id);
                      return (
                        <div key={offer.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <div className="flex items-start gap-3">
                            {/* Imagen miniatura */}
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0">
                              {offer.image_url ? (
                                <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            {/* Detalles */}
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{offer.title}</p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[offer.status] || "bg-slate-100 text-slate-500"}`}>
                                  {offer.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-slate-400 line-through">{formatMoney(offer.regular_price)}</span>
                                <span className="text-sm font-bold text-rose-600">{formatMoney(offer.offer_price)}</span>
                                <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-bold">-{disc}%</span>
                                <span className="text-[10px] text-slate-400 ml-auto">{offer.sold_count ?? 0} vendidos</span>
                              </div>
                              {/* Acciones */}
                              <div className="flex gap-2">
                                {/* Republicar — solo si no está Pendiente */}
                                {offer.status !== "Pendiente" && (
                                  <button
                                    onClick={() => handleRepublishOffer(offer)}
                                    disabled={isProcessing}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    {offerAction === offer.id + "-rep" ? "..." : "Re-publicar"}
                                  </button>
                                )}
                                {/* Eliminar */}
                                <button
                                  onClick={() => handleDeleteOffer(offer)}
                                  disabled={isProcessing}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors disabled:opacity-50"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  {offerAction === offer.id + "-del" ? "..." : "Eliminar"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
