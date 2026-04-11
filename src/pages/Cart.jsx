import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import useCartStore from "../store/useCartStore";
import { buyCoupon } from "../services/purchaseService";
import toast from "react-hot-toast";

const STEPS = { CART: "cart", FORM: "form", PROCESSING: "processing", SUCCESS: "success" };

function formatMoney(v) {
  return new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(v ?? 0);
}

function formatCardNumber(val) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(val) {
  return val.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2");
}

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const total = items.reduce((s, i) => s + i.offer.offer_price * i.quantity, 0);

  const [step, setStep]   = useState(STEPS.CART);
  const [card, setCard]   = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [errors, setErrors] = useState({});
  const [results, setResults] = useState([]); // [{title, ok, message}]

  const handleCardChange = (e) => {
    let { name, value } = e.target;
    if (name === "number") value = formatCardNumber(value);
    if (name === "expiry") value = formatExpiry(value);
    if (name === "cvv") value = value.replace(/\D/g, "").slice(0, 4);
    setCard(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (card.number.replace(/\s/g, "").length < 16) e.number = "Número inválido";
    if (!card.name.trim()) e.name = "Ingresá el nombre";
    if (card.expiry.length < 5) e.expiry = "Fecha inválida";
    if (card.cvv.length < 3) e.cvv = "CVV inválido";
    return e;
  };

  const handlePay = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setStep(STEPS.PROCESSING);

    // Simular delay de procesamiento
    await new Promise(r => setTimeout(r, 1800));

    const res = [];
    for (const item of items) {
      for (let q = 0; q < item.quantity; q++) {
        try {
          await buyCoupon({ offer_id: item.offer.id, quantity: 1 });
          res.push({ title: item.offer.title, ok: true, message: "Cupón adquirido" });
        } catch (err) {
          res.push({ title: item.offer.title, ok: false, message: err.response?.data?.message || "Error al adquirir" });
        }
      }
    }

    setResults(res);
    setStep(STEPS.SUCCESS);

    const allOk = res.every(r => r.ok);
    if (allOk) {
      clearCart();
      toast.success("¡Todos los cupones adquiridos!");
    } else {
      toast.error("Algunos cupones no pudieron procesarse");
    }
  };

  const cardType = card.number.startsWith("4") ? "VISA"
    : card.number.startsWith("5") ? "MASTERCARD"
    : card.number.startsWith("3") ? "AMEX" : null;

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all bg-slate-50";

  if (items.length === 0 && step === STEPS.CART) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans pb-20 transition-colors duration-300">
        <Navbar />
        <div className="pt-24 flex flex-col items-center justify-center py-32 px-4 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Tu carrito está vacío</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Explorá las ofertas y agrega cupones a tu carrito.</p>
          <button
            onClick={() => navigate("/offers")}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-lg shadow-rose-500/30 transition-all"
          >
            Ver ofertas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans pb-20 transition-colors duration-300">
      <Navbar />

      {/* Hero */}
      <div className="pt-24 pb-10 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-white mb-1">
            Mi <span className="text-rose-400">Carrito</span>
          </h1>
          <p className="text-slate-400 text-sm">
            {step === STEPS.SUCCESS ? "Resumen de compra" : `${items.length} oferta(s) seleccionada(s)`}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Items del carrito ──────────────────────────────── */}
          <div className="lg:col-span-2 space-y-3">
            {step === STEPS.SUCCESS ? (
              // Resultados finales
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Compra completada</h3>
                    <p className="text-sm text-slate-500">Revisá el estado de cada cupón</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {results.map((r, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${r.ok ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"}`}>
                      <span className="text-lg">{r.ok ? "✅" : "❌"}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.title}</p>
                        <p className="text-xs text-slate-500">{r.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate("/coupons")}
                  className="mt-5 w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 transition-all"
                >
                  Ver mis cupones →
                </button>
              </div>
            ) : (
              // Lista de items
              items.map(item => {
                const disc = Math.round(((item.offer.regular_price - item.offer.offer_price) / item.offer.regular_price) * 100);
                return (
                  <div key={item.offer.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0">
                      <img
                        src={item.offer.image_url || `https://picsum.photos/seed/${item.offer.id}/200/200`}
                        alt={item.offer.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{item.offer.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.offer.company?.name}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.offer.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        {/* Controles de cantidad */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.offer.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center font-bold text-sm"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-semibold text-slate-800 dark:text-slate-200 text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.offer.id, item.quantity + 1)}
                            disabled={item.offer.coupon_per_user_limit && item.quantity >= item.offer.coupon_per_user_limit}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-bold text-sm"
                          >
                            +
                          </button>
                        </div>
                        {/* Precio subtotal */}
                        <div className="text-right">
                          <p className="text-xs text-slate-400 line-through">{formatMoney(item.offer.regular_price * item.quantity)}</p>
                          <p className="font-bold text-rose-600 text-sm">{formatMoney(item.offer.offer_price * item.quantity)}</p>
                          <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-bold">-{disc}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Resumen + Pago ─────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 sticky top-24">

              {(step === STEPS.CART) && (
                <>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Resumen</h3>
                  <div className="space-y-2 mb-4">
                    {items.map(i => (
                      <div key={i.offer.id} className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span className="truncate mr-2">{i.offer.title} ×{i.quantity}</span>
                        <span className="shrink-0 font-medium">{formatMoney(i.offer.offer_price * i.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between font-bold text-slate-900 dark:text-slate-100 mb-4">
                    <span>Total</span>
                    <span className="text-rose-600">{formatMoney(total)}</span>
                  </div>
                  <button
                    onClick={() => setStep(STEPS.FORM)}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-md shadow-rose-500/20 transition-all"
                  >
                    Proceder al pago
                  </button>
                  <button
                    onClick={() => navigate("/offers")}
                    className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    ← Seguir comprando
                  </button>
                </>
              )}

              {step === STEPS.FORM && (
                <>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Datos de pago</h3>
                  <p className="text-xs text-slate-500 mb-4">Total: <span className="font-bold text-rose-600">{formatMoney(total)}</span></p>

                  {/* Card preview */}
                  <div className="relative h-28 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-4 overflow-hidden mb-4">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-6 translate-x-6"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-1">
                          <div className="w-5 h-4 bg-yellow-400/80 rounded-sm"></div>
                          <div className="w-5 h-4 bg-yellow-500/50 rounded-sm -ml-2"></div>
                        </div>
                        {cardType && <span className="text-white font-bold text-xs tracking-wider">{cardType}</span>}
                      </div>
                      <div>
                        <p className="text-white font-mono text-xs tracking-widest">{card.number || "•••• •••• •••• ••••"}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-white/70 text-xs uppercase truncate max-w-[100px]">{card.name || "NOMBRE"}</p>
                        <p className="text-white/70 text-xs">{card.expiry || "MM/AA"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">N° de tarjeta</label>
                      <input name="number" value={card.number} onChange={handleCardChange} placeholder="1234 5678 9012 3456" className={inputCls} />
                      {errors.number && <p className="text-red-500 text-xs mt-0.5">{errors.number}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre en la tarjeta</label>
                      <input name="name" value={card.name} onChange={handleCardChange} placeholder="Juan Pérez" className={inputCls} />
                      {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Vencimiento</label>
                        <input name="expiry" value={card.expiry} onChange={handleCardChange} placeholder="MM/AA" className={inputCls} />
                        {errors.expiry && <p className="text-red-500 text-xs mt-0.5">{errors.expiry}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">CVV</label>
                        <input name="cvv" value={card.cvv} onChange={handleCardChange} placeholder="•••" className={inputCls} />
                        {errors.cvv && <p className="text-red-500 text-xs mt-0.5">{errors.cvv}</p>}
                      </div>
                    </div>

                    <button
                      onClick={handlePay}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-md shadow-rose-500/20 transition-all mt-1"
                    >
                      Pagar {formatMoney(total)}
                    </button>
                    <button
                      onClick={() => setStep(STEPS.CART)}
                      className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      ← Volver al carrito
                    </button>

                    <p className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Pago simulado — sin cargos reales
                    </p>
                  </div>
                </>
              )}

              {step === STEPS.PROCESSING && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Procesando pago...</p>
                  <p className="text-xs text-slate-400">Por favor esperá</p>
                </div>
              )}

              {step === STEPS.SUCCESS && (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {results.filter(r => r.ok).length} de {results.length} cupón(es) adquirido(s)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
