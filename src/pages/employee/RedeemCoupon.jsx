import { useState } from "react";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import useAuthStore from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useEffect } from "react";

export default function RedeemCoupon() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [code,       setCode]       = useState("");
  const [verified,   setVerified]   = useState(null);
  const [verifying,  setVerifying]  = useState(false);
  const [redeeming,  setRedeeming]  = useState(false);
  const [success,    setSuccess]    = useState(null);

  useEffect(() => {
    if (user && user.role !== "employee" && user.role !== "company_admin") {
      navigate("/offers");
    }
  }, [user, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setVerifying(true);
    setVerified(null);
    setSuccess(null);
    try {
      const res = await api.get(`/employee/coupons/verify/${code.trim().toUpperCase()}`);
      setVerified(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Cupón no encontrado");
      setVerified(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleRedeem = async () => {
    setRedeeming(true);
    try {
      const res = await api.post("/employee/coupons/redeem", { code: code.trim().toUpperCase() });
      setSuccess(res.data);
      setVerified(null);
      setCode("");
      toast.success("¡Cupón canjeado exitosamente!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al canjear");
    } finally {
      setRedeeming(false);
    }
  };

  const handleReset = () => {
    setCode("");
    setVerified(null);
    setSuccess(null);
  };

  const statusBadge = (status) => {
    if (status === "available") return { label: "Disponible", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" };
    if (status === "redeemed")  return { label: "Ya canjeado", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" };
    if (status === "expired")   return { label: "Vencido",     cls: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400" };
    return { label: status, cls: "bg-slate-100 text-slate-500" };
  };

  const formatMoney = (v) => new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(v);
  const formatDate  = (d) => d ? new Date(d).toLocaleDateString("es-SV", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-300">
      <Navbar />

      {/* Hero */}
      <div className="pt-24 pb-12 px-4 bg-slate-900">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Canjear Cupón</h1>
          <p className="text-slate-300 text-sm">Ingresá el código del cupón del cliente para verificarlo y canjearlo</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-10">

        {/* Formulario de verificación */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 mb-6">
          <form onSubmit={handleVerify} className="flex gap-3">
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: ABC0012345"
              className="flex-grow border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-mono font-bold tracking-widest bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase"
              maxLength={20}
              required
            />
            <button
              type="submit"
              disabled={verifying || !code.trim()}
              className="px-5 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold hover:bg-slate-700 dark:hover:bg-white transition-colors disabled:opacity-50"
            >
              {verifying ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : "Verificar"}
            </button>
          </form>
        </div>

        {/* Resultado de verificación */}
        {verified && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden mb-6 animate-in fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-500 to-red-600 px-6 py-4">
              <p className="text-white font-bold text-lg">{verified.company_name}</p>
              <p className="text-rose-100 text-sm">{verified.offer_title}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 text-center border border-dashed border-slate-300 dark:border-slate-600">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Código</p>
                <p className="font-mono font-black text-2xl text-rose-600 tracking-widest">{verified.code}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Estado</p>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(verified.status).cls}`}>
                    {statusBadge(verified.status).label}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Valor</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatMoney(verified.offer_price)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Vence</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatDate(verified.expiration_date)}</p>
                </div>
              </div>

              {verified.status === "available" ? (
                <button
                  onClick={handleRedeem}
                  disabled={redeeming}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                >
                  {redeeming ? "Canjeando..." : "✓ Confirmar Canje"}
                </button>
              ) : (
                <div className="w-full py-3.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold text-sm text-center">
                  Este cupón no puede ser canjeado
                </div>
              )}
              <button onClick={handleReset} className="w-full py-2 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                Limpiar y buscar otro
              </button>
            </div>
          </div>
        )}

        {/* Éxito */}
        {success && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-800 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">¡Cupón canjeado!</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{success.offer_title}</p>
            <p className="font-mono font-bold text-rose-600 tracking-widest mb-6">{success.code}</p>
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-xl bg-rose-500 text-white font-semibold text-sm hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20"
            >
              Canjear otro cupón
            </button>
          </div>
        )}

        {/* Info */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mt-6">
          <p className="text-amber-700 dark:text-amber-400 text-sm font-medium flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Solo podés canjear cupones de tu empresa. Los cupones canjeados no pueden ser revertidos.
          </p>
        </div>
      </div>
    </div>
  );
}
