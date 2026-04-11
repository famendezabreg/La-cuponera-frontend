import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import useThemeStore from "../store/useThemeStore";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";

function Section({ title, icon, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
        <span className="text-rose-500">{icon}</span>
        <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Profile() {
  const navigate = useNavigate();
  const { logout: logoutAction, user, checkAuth } = useAuthStore();
  const { isDark, toggleDark } = useThemeStore();

  const [profileData, setProfileData] = useState({ email: "", phone: "" });
  const [editMode, setEditMode] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current_password: "", new_password: "", new_password_confirmation: ""
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    api.get("/user").then(res => {
      const u = res.data;
      setProfileData({
        email: u.email || "",
        phone: u.client?.phone || ""
      });
    }).catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await api.put("/user/profile", profileData);
      toast.success(res.data.message);
      setEditMode(false);
      checkAuth();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.values(errors).flat().forEach(e => toast.error(e));
      } else {
        toast.error(err.response?.data?.message || "Error al actualizar");
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setLoadingPassword(true);
    try {
      const res = await api.post("/change-password", passwordForm);
      toast.success(res.data.message);
      setPasswordForm({ current_password: "", new_password: "", new_password_confirmation: "" });
      setShowPasswordSection(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al cambiar contraseña");
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleLogout = () => {
    logoutAction();
    navigate("/offers");
  };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-24 pb-32 px-4 bg-slate-900 dark:bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-900/40 via-slate-900 to-slate-900"></div>
        {/* Wave inferior para transición suave */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-slate-100 dark:bg-slate-900 rounded-t-[3rem]"></div>
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center shadow-2xl shadow-rose-500/40 mb-4">
            <span className="text-3xl font-black text-white">{initials}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">{user?.name || "Mi perfil"}</h1>
          <p className="text-slate-400">{profileData.email}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16 -mt-8 relative z-10 space-y-5">

        {/* Info personal */}
        <Section
          title="Información personal"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Correo electrónico</label>
              {editMode ? (
                <input
                  type="email"
                  value={profileData.email}
                  onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                  className="input-premium dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                />
              ) : (
                <p className="text-slate-800 dark:text-slate-200 font-medium">{profileData.email || "—"}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Teléfono</label>
              {editMode ? (
                <input
                  type="text"
                  maxLength={8}
                  value={profileData.phone}
                  onChange={e => setProfileData({ ...profileData, phone: e.target.value.replace(/\D/g, "") })}
                  className="input-premium dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                  placeholder="8 dígitos"
                />
              ) : (
                <p className="text-slate-800 dark:text-slate-200 font-medium">{profileData.phone || "—"}</p>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              {editMode ? (
                <>
                  <button
                    onClick={handleSaveProfile}
                    disabled={loadingProfile}
                    className="flex-1 btn-primary py-2.5 text-sm"
                  >
                    {loadingProfile ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="py-2.5 px-5 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 transition-all"
                >
                  Editar información
                </button>
              )}
            </div>
          </div>
        </Section>

        {/* Apariencia */}
        <Section
          title="Apariencia"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          }
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Modo oscuro</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Cambia el tema visual de la aplicación</p>
            </div>
            <button
              onClick={toggleDark}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                isDark ? "bg-rose-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                  isDark ? "translate-x-7" : "translate-x-0"
                }`}
              >
                {isDark ? (
                  <svg className="w-3 h-3 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
            </button>
          </div>
        </Section>

        {/* Cambiar contraseña */}
        <Section
          title="Contraseña"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        >
          {!showPasswordSection ? (
            <button
              onClick={() => setShowPasswordSection(true)}
              className="py-2.5 px-5 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 transition-all"
            >
              Cambiar contraseña
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {[
                { name: "current_password", label: "Contraseña actual" },
                { name: "new_password", label: "Nueva contraseña" },
                { name: "new_password_confirmation", label: "Confirmar nueva contraseña" }
              ].map(({ name, label }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
                  <input
                    type="password"
                    value={passwordForm[name]}
                    onChange={e => setPasswordForm({ ...passwordForm, [name]: e.target.value })}
                    className="input-premium dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                    placeholder="••••••••"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loadingPassword} className="flex-1 btn-primary py-2.5 text-sm">
                  {loadingPassword ? "Actualizando..." : "Actualizar contraseña"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </Section>

        {/* Cerrar sesión */}
        <Section
          title="Sesión"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          }
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Al cerrar sesión serás redirigido a la página de ofertas.
          </p>
          <button
            onClick={handleLogout}
            className="py-2.5 px-5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-all"
          >
            Cerrar sesión
          </button>
        </Section>

      </div>
    </div>
  );
}

export default Profile;

