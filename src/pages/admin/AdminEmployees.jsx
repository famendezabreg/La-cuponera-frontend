import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminLayout from "./AdminLayout";
import toast from "react-hot-toast";

const EMPTY_FORM = { name: "", email: "", password: "", role: "employee", company_id: "", position: "" };

export default function AdminEmployees() {
  const [employees,  setEmployees]  = useState([]);
  const [companies,  setCompanies]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/admin/employees"),
      api.get("/admin/companies"),
    ]).then(([e, c]) => {
      setEmployees(e.data);
      setCompanies(c.data);
    }).catch(() => toast.error("Error al cargar"))
    .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/employees", form);
      toast.success("Empleado/Admin creado correctamente");
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) Object.values(errors).flat().forEach(m => toast.error(m));
      else toast.error(err.response?.data?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (emp) => {
    if (!confirm(`¿Eliminar a "${emp.name}"?`)) return;
    try {
      await api.delete(`/admin/employees/${emp.id}`);
      toast.success("Empleado eliminado");
      load();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const roleLabel = (role) => role === "company_admin" ? "Admin Empresa" : "Empleado";
  const roleBadge = (role) =>
    role === "company_admin"
      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
      : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Empleados y Admins de Empresa</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{employees.length} usuario(s) registrado(s)</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo usuario
          </button>
        </div>

        {/* Modal form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Nuevo empleado / admin de empresa</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "name",     label: "Nombre completo", type: "text",     colSpan: "col-span-2" },
                    { name: "email",    label: "Email",           type: "email",    colSpan: "" },
                    { name: "password", label: "Contraseña",      type: "password", colSpan: "" },
                    { name: "position", label: "Cargo / Puesto",  type: "text",     colSpan: "col-span-2" },
                  ].map(f => (
                    <div key={f.name} className={f.colSpan}>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{f.label}</label>
                      <input
                        type={f.type}
                        name={f.name}
                        value={form[f.name]}
                        onChange={handleChange}
                        className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer"
                        required={f.name !== "position"}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rol</label>
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer"
                    >
                      <option value="employee">Empleado</option>
                      <option value="company_admin">Admin de Empresa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Empresa</label>
                    <select
                      name="company_id"
                      value={form.company_id}
                      onChange={handleChange}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Seleccionar empresa</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50">
                    {saving ? "Guardando..." : "Crear usuario"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Cargando...</div>
          ) : employees.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500">No hay empleados registrados</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  {["Nombre", "Email", "Rol", "Cargo", "Empresa", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">{emp.name}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{emp.email}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${roleBadge(emp.role)}`}>
                        {roleLabel(emp.role)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{emp.position}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{emp.company_name}</td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => handleDelete(emp)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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
