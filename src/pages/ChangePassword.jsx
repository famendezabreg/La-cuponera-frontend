import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";

function ChangePassword() {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: ""
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.current_password || !form.new_password || !form.new_password_confirmation) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    if (form.new_password !== form.new_password_confirmation) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/change-password", form);
      toast.success(res.data.message || "Contraseña actualizada correctamente");
      navigate("/offers");
    } catch (err) {
      const msg = err.response?.data?.message || "Error al cambiar contraseña";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <Navbar />

      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full max-w-7xl overflow-hidden -z-10 h-full pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-rose-200/40 blur-3xl"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-orange-200/40 blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 mt-16">
        <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-rose-500 to-red-600 rounded-2xl shadow-xl shadow-rose-500/40 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Cambiar Contraseña
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Actualizá tu contraseña de acceso
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="glass shadow-2xl sm:rounded-3xl sm:px-10 px-6 py-8 border border-white/50">
          <form className="space-y-5" onSubmit={handleSubmit}>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña actual
              </label>
              <input
                type="password"
                name="current_password"
                onChange={handleChange}
                className="input-premium"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                name="new_password"
                onChange={handleChange}
                className="input-premium"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                name="new_password_confirmation"
                onChange={handleChange}
                className="input-premium"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Actualizando...
                  </span>
                ) : (
                  "Cambiar contraseña"
                )}
              </button>
            </div>

          </form>

          <button
            onClick={() => navigate("/offers")}
            className="mt-4 w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all duration-300"
          >
            Volver a ofertas
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;
