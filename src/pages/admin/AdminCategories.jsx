import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminLayout from "./AdminLayout";
import toast from "react-hot-toast";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [name, setName]             = useState("");
  const [saving, setSaving]         = useState(false);

  const load = () => {
    setLoading(true);
    api.get("/admin/categories")
      .then(res => setCategories(res.data))
      .catch(() => toast.error("Error al cargar categorías"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setEditItem(null); setName(""); setShowForm(true); };
  const openEdit   = (cat) => { setEditItem(cat); setName(cat.name); setShowForm(true); };
  const closeForm  = () => { setShowForm(false); setEditItem(null); setName(""); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("El nombre es requerido");
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/admin/categories/${editItem.id}`, { name });
        toast.success("Categoría actualizada");
      } else {
        await api.post("/admin/categories", { name });
        toast.success("Categoría creada");
      }
      closeForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`¿Eliminar "${cat.name}"?`)) return;
    try {
      await api.delete(`/admin/categories/${cat.id}`);
      toast.success("Categoría eliminada");
      load();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Rubros / Categorías</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Gestiona los rubros de las empresas</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva categoría
          </button>
        </div>

        {/* Modal form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                {editItem ? "Editar categoría" : "Nueva categoría"}
              </h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Ej: Restaurantes"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
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
        )}

        {/* Lista */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500">Cargando...</div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500">No hay categorías</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-400">#</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-400">Nombre</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-400">Empresas</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {categories.map((cat, i) => (
                  <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-slate-400">{i + 1}</td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{cat.name}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{cat.companies_count ?? 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(cat)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
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
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
