import { useState } from "react";
import useAuthStore from "../store/useAuthStore";
import { useNavigate, Navigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

const STEPS_LABELS = ["Cuenta", "Personal", "Ubicación"];

const FIELD_DEF = [
  // Paso 0
  { name: "first_name", label: "Nombres",             type: "text",     placeholder: "Juan",              step: 0 },
  { name: "last_name",  label: "Apellidos",           type: "text",     placeholder: "Pérez",             step: 0 },
  { name: "email",      label: "Correo electrónico",  type: "email",    placeholder: "juan@ejemplo.com",  step: 0 },
  { name: "password",   label: "Contraseña",          type: "password", placeholder: "Mínimo 8 caracteres", step: 0 },
  // Paso 1
  { name: "dui",        label: "DUI (sin guiones)",   type: "text",     placeholder: "000000000",         step: 1, maxLength: 9, hint: "9 dígitos" },
  { name: "phone",      label: "Teléfono",            type: "text",     placeholder: "70000000",          step: 1, maxLength: 8, hint: "8 dígitos" },
  // Paso 2
  { name: "address",    label: "Dirección",           type: "text",     placeholder: "Colonia, municipio, departamento", step: 2, fullRow: true },
];

const EMPTY_FORM = {
  first_name: "", last_name: "", email: "", password: "",
  dui: "", phone: "", address: ""
};

const PERKS = [
  { icon: "🏷️", title: "Cupones únicos",    desc: "Códigos generados al instante para tus compras" },
  { icon: "🔒", title: "100% seguro",       desc: "Tus datos protegidos con encriptación de extremo a extremo" },
  { icon: "📲", title: "Siempre disponible", desc: "Accedé a tus cupones desde cualquier dispositivo" },
];

export default function Register() {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const { register, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/offers" replace />;

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.first_name || !form.last_name) { toast.error("Ingresá tu nombre completo"); return false; }
      if (!form.email)    { toast.error("Ingresá tu correo"); return false; }
      if (!form.password || form.password.length < 8) { toast.error("La contraseña debe tener al menos 8 caracteres"); return false; }
    }
    if (step === 1) {
      if (!/^\d{9}$/.test(form.dui))   { toast.error("El DUI debe tener 9 dígitos numéricos"); return false; }
      if (!/^\d{8}$/.test(form.phone)) { toast.error("El teléfono debe tener 8 dígitos"); return false; }
    }
    if (step === 2) {
      if (!form.address) { toast.error("Ingresá tu dirección"); return false; }
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);
    const success = await register(form);
    if (success) navigate("/");
    setLoading(false);
  };

  const stepFields = FIELD_DEF.filter(f => f.step === step);

  const inputBase = "w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all";

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans">

      {/* ── Panel izquierdo: brand ──────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden bg-slate-900 p-14">
        {/* Blobs */}
        <div className="absolute -top-40 -right-20 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-red-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-tr from-rose-500 to-red-600 rounded-2xl shadow-lg shadow-rose-500/40 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">La Cuponera</span>
        </div>

        {/* Hero */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-3">
              Creá tu cuenta<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-500">
                gratis hoy.
              </span>
            </h1>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              Accedé a cientos de descuentos exclusivos y empezá a ahorrar desde el primer día.
            </p>
          </div>

          {/* Perks */}
          <div className="space-y-4">
            {PERKS.map((p, i) => (
              <div key={i} className="flex items-start gap-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-sm">
                <span className="text-2xl shrink-0">{p.icon}</span>
                <div>
                  <p className="font-bold text-white text-sm">{p.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Already have account */}
        <div className="relative z-10 flex items-center gap-3 pt-6 border-t border-slate-700/50">
          <p className="text-slate-500 text-sm">¿Ya tenés una cuenta?</p>
          <Link to="/" className="text-sm font-semibold text-rose-400 hover:text-rose-300 transition-colors">
            Iniciar sesión →
          </Link>
        </div>
      </div>

      {/* ── Panel derecho: formulario por pasos ────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 py-12 bg-slate-950 overflow-y-auto">

        {/* Logo mobile */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-tr from-rose-500 to-red-600 rounded-xl shadow-lg shadow-rose-500/40 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-lg font-extrabold text-white">La Cuponera</span>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-7">
            <h2 className="text-3xl font-extrabold text-white mb-1">Crear cuenta</h2>
            <p className="text-slate-400 text-sm">Completá los pasos para registrarte</p>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-0 mb-7">
            {STEPS_LABELS.map((label, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    i < step  ? "bg-rose-500 text-white shadow-md shadow-rose-500/30" :
                    i === step ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 ring-4 ring-rose-500/20" :
                                 "bg-slate-800 text-slate-500 border border-slate-700"
                  }`}>
                    {i < step ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : i + 1}
                  </div>
                  <span className={`text-[10px] font-semibold mt-1.5 whitespace-nowrap ${
                    i <= step ? "text-rose-400" : "text-slate-600"
                  }`}>
                    {label}
                  </span>
                </div>
                {i < STEPS_LABELS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 mb-4 transition-all duration-500 ${
                    i < step ? "bg-rose-500" : "bg-slate-700"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl shadow-black/40">

            <form onSubmit={handleSubmit}>
              {/* Campos del paso actual */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                {stepFields.map(field => (
                  <div key={field.name} className={field.fullRow || field.type === "password" ? "col-span-2" : "col-span-1"}>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                      {field.label}
                      {field.hint && <span className="ml-2 text-slate-600 normal-case font-normal tracking-normal">({field.hint})</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={field.name === "password" ? (showPwd ? "text" : "password") : field.type}
                        name={field.name}
                        value={form[field.name]}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        maxLength={field.maxLength}
                        className={inputBase}
                      />
                      {field.name === "password" && (
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showPwd ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botones de navegación */}
              <div className="flex gap-3 mt-2">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-400 bg-slate-800 border border-slate-700 hover:border-slate-600 hover:text-slate-200 transition-all"
                  >
                    ← Atrás
                  </button>
                )}
                {step < STEPS_LABELS.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-lg shadow-rose-500/20 transition-all hover:-translate-y-0.5"
                  >
                    Siguiente →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-lg shadow-rose-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Registrando...
                      </>
                    ) : (
                      <>
                        Crear cuenta
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Divider + Login link */}
            <div className="flex items-center gap-3 mt-6 mb-4">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-600">¿Ya tenés cuenta?</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-400 bg-slate-800 border border-slate-700 hover:border-rose-500/50 hover:text-white hover:bg-slate-700 transition-all"
            >
              Iniciar sesión
            </Link>
          </div>

          {/* Progress indicator mobile */}
          <p className="text-center text-xs text-slate-600 mt-4">
            Paso {step + 1} de {STEPS_LABELS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
