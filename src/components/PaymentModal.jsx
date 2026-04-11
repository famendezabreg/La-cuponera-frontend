import { useState } from "react";

const STEPS = { FORM: "form", PROCESSING: "processing", SUCCESS: "success" };

function PaymentModal({ offer, onClose, onConfirm }) {
  const [step, setStep] = useState(STEPS.FORM);
  const [card, setCard] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: ""
  });
  const [errors, setErrors] = useState({});

  const formatCardNumber = (val) =>
    val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const formatExpiry = (val) =>
    val.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2");

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "number") value = formatCardNumber(value);
    if (name === "expiry") value = formatExpiry(value);
    if (name === "cvv") value = value.replace(/\D/g, "").slice(0, 4);
    setCard({ ...card, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const e = {};
    if (card.number.replace(/\s/g, "").length < 16) e.number = "Número inválido";
    if (!card.name.trim()) e.name = "Ingresá el nombre";
    if (card.expiry.length < 5) e.expiry = "Fecha inválida";
    if (card.cvv.length < 3) e.cvv = "CVV inválido";
    return e;
  };

  const handlePay = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setStep(STEPS.PROCESSING);
    setTimeout(() => {
      setStep(STEPS.SUCCESS);
      setTimeout(() => onConfirm(), 1500);
    }, 2500);
  };

  const formatMoney = (n) =>
    new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(n);

  // Detectar tipo de tarjeta por el primer dígito
  const cardType = card.number.startsWith("4")
    ? "VISA"
    : card.number.startsWith("5")
    ? "MASTERCARD"
    : card.number.startsWith("3")
    ? "AMEX"
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-red-600 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">Pago seguro</p>
            <p className="text-white font-bold text-xl">{formatMoney(offer.offer_price)}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6">

          {/* Detalle de la oferta */}
          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{offer.title}</p>
              <p className="text-sm text-slate-500">{offer.company?.name}</p>
            </div>
            <div className="ml-auto text-right shrink-0">
              <p className="text-xs text-slate-400 line-through">{formatMoney(offer.regular_price)}</p>
              <p className="font-bold text-rose-600">{formatMoney(offer.offer_price)}</p>
            </div>
          </div>

          {/* STEP: Formulario */}
          {step === STEPS.FORM && (
            <div className="space-y-4">

              {/* Vista previa de tarjeta */}
              <div className="relative h-36 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-5 overflow-hidden mb-2">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-1">
                      <div className="w-6 h-5 bg-yellow-400/80 rounded-sm"></div>
                      <div className="w-6 h-5 bg-yellow-500/50 rounded-sm -ml-3"></div>
                    </div>
                    {cardType && (
                      <span className="text-white font-bold text-sm tracking-wider">{cardType}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-white/50 text-xs mb-0.5">Número de tarjeta</p>
                    <p className="text-white font-mono text-base tracking-widest">
                      {card.number || "•••• •••• •••• ••••"}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-white/50 text-xs">Titular</p>
                      <p className="text-white text-sm uppercase truncate max-w-[160px]">
                        {card.name || "NOMBRE APELLIDO"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/50 text-xs">Vence</p>
                      <p className="text-white text-sm">{card.expiry || "MM/AA"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Número */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número de tarjeta</label>
                <input
                  name="number"
                  value={card.number}
                  onChange={handleChange}
                  placeholder="1234 5678 9012 3456"
                  className={`input-premium ${errors.number ? "border-red-400 focus:ring-red-400" : ""}`}
                />
                {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre en la tarjeta</label>
                <input
                  name="name"
                  value={card.name}
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  className={`input-premium ${errors.name ? "border-red-400 focus:ring-red-400" : ""}`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Expiry + CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vencimiento</label>
                  <input
                    name="expiry"
                    value={card.expiry}
                    onChange={handleChange}
                    placeholder="MM/AA"
                    className={`input-premium ${errors.expiry ? "border-red-400 focus:ring-red-400" : ""}`}
                  />
                  {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CVV</label>
                  <input
                    name="cvv"
                    value={card.cvv}
                    onChange={handleChange}
                    placeholder="•••"
                    className={`input-premium ${errors.cvv ? "border-red-400 focus:ring-red-400" : ""}`}
                  />
                  {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                </div>
              </div>

              <button onClick={handlePay} className="btn-primary mt-2">
                Pagar {formatMoney(offer.offer_price)}
              </button>

              <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Pago simulado — ningún cargo real será efectuado
              </p>
            </div>
          )}

          {/* STEP: Procesando */}
          {step === STEPS.PROCESSING && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
              <p className="font-semibold text-slate-700">Procesando pago...</p>
              <p className="text-sm text-slate-400">Por favor no cerrés esta ventana</p>
            </div>
          )}

          {/* STEP: Éxito */}
          {step === STEPS.SUCCESS && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-bold text-slate-800 text-lg">¡Pago exitoso!</p>
              <p className="text-sm text-slate-500">Redirigiendo a tus cupones...</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
