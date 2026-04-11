import { useEffect, useState } from "react";
import api from "../services/api";
import { buyCoupon } from "../services/purchaseService";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PaymentModal from "../components/PaymentModal";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";
import toast from "react-hot-toast";

function Offers() {
  const [allOffers,      setAllOffers]      = useState([]);
  const [groupedOffers,  setGroupedOffers]  = useState({});
  const [allCategories,  setAllCategories]  = useState([]); // todos los rubros del sistema
  const [loading,        setLoading]        = useState(true);
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [selectedOffer,  setSelectedOffer]  = useState(null);
  const [buyingId,       setBuyingId]       = useState(null);
  const [search,         setSearch]         = useState("");

  const { isAuthenticated } = useAuthStore();
  const { addToCart } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Cargamos rubros y ofertas en paralelo
    Promise.all([
      api.get("/offers"),
      api.get("/categories"),
    ]).then(([offersRes, catsRes]) => {
        const offers = offersRes.data.data;
        setAllOffers(offers);
        setAllCategories(catsRes.data || []);

        const grouped = {};
        offers.forEach((offer) => {
          const category = offer.company?.category?.name || "Otros";
          if (!grouped[category]) grouped[category] = [];
          grouped[category].push(offer);
        });
        setGroupedOffers(grouped);
      })
      .catch(() => toast.error("No se pudieron cargar las ofertas."))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = (offer) => {
    if (!isAuthenticated) {
      toast("Iniciá sesión para adquirir cupones", { icon: "🔒" });
      navigate("/");
      return;
    }
    addToCart(offer, 1);
    toast.success(`"${offer.title}" agregado al carrito 🛒`, { duration: 2000 });
  };

  const handleBuyClick = (offer) => {
    if (!isAuthenticated) {
      toast("Iniciá sesión para adquirir cupones", { icon: "🔒" });
      navigate("/");
      return;
    }
    setSelectedOffer(offer);
  };

  const handlePaymentConfirm = async () => {
    setBuyingId(selectedOffer.id);
    setSelectedOffer(null);
    try {
      const res = await buyCoupon({ offer_id: selectedOffer.id, quantity: 1 });
      toast.success(res.data.message || "¡Cupón adquirido!");
      navigate("/coupons");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al procesar la compra.");
    } finally {
      setBuyingId(null);
    }
  };

  // Combinamos rubros del sistema + los que tienen ofertas aprobadas activas
  // Esto garantiza que un rubro nuevo aparezca en el filtro aunque aún no tenga ofertas
  const categoriesFromOffers = Object.keys(groupedOffers);
  const categoriesFromApi    = allCategories.map(c => c.name);
  const uniqueCategories     = [...new Set([...categoriesFromApi, ...categoriesFromOffers])].sort();
  const categories = ["Todas", ...uniqueCategories];

  const formatMoney = (amount) =>
    new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(amount);

  // ── Filtrado combinado: búsqueda + categoría ─────────────────────
  const searchTerm = search.toLowerCase().trim();

  const getVisibleOffers = () => {
    if (!searchTerm) {
      // Sin búsqueda: usar el agrupado normal
      return null; // signal to use groupedOffers
    }
    // Con búsqueda: buscar en todos los campos y agrupar resultado
    return allOffers.filter(o =>
      o.title?.toLowerCase().includes(searchTerm) ||
      o.description?.toLowerCase().includes(searchTerm) ||
      o.company?.name?.toLowerCase().includes(searchTerm) ||
      o.company?.category?.name?.toLowerCase().includes(searchTerm)
    );
  };

  const searchResults = getVisibleOffers();

  // Para cuando hay búsqueda activa: flat list en una sola "categoría"
  const renderOfferCard = (offer) => {
    const discount = Math.round(((offer.regular_price - offer.offer_price) / offer.regular_price) * 100);
    return (
      <div
        key={offer.id}
        className="group bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl border border-slate-100 dark:border-slate-700 transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full"
      >
        <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-700">
          <img
            src={offer.image_url || `https://picsum.photos/seed/${offer.id}/400/300`}
            alt={offer.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
          />
          <div className="absolute top-4 right-4 bg-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-rose-500/40">
            -{discount}%
          </div>
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
            {offer.company?.name || "Empresa"}
          </div>
        </div>

        <div className="p-5 flex flex-col flex-grow">
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight mb-2 line-clamp-2">
            {offer.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-grow">
            {offer.description}
          </p>

          <div className="flex items-end justify-between mb-5 mt-auto">
            <div>
              <p className="text-xs text-slate-400 line-through mb-0.5">{formatMoney(offer.regular_price)}</p>
              <p className="text-2xl font-black text-rose-600 leading-none">{formatMoney(offer.offer_price)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                {offer.coupon_limit ? "Limitado" : "Disponible"}
              </p>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {offer.coupon_limit ? `${offer.coupon_limit} disp.` : "∞"}
              </p>
            </div>
          </div>

          {isAuthenticated ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleAddToCart(offer)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                title="Agregar al carrito"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Carrito
              </button>
              <button
                onClick={() => handleBuyClick(offer)}
                disabled={buyingId === offer.id}
                className="flex-1 flex justify-center py-2.5 px-3 rounded-xl text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-rose-500/30"
              >
                {buyingId === offer.id ? "..." : "Comprar"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleBuyClick(offer)}
              className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white transition-all duration-300 group-hover:bg-rose-500 group-hover:text-white"
            >
              Iniciar sesión para comprar
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans pb-20 transition-colors duration-300">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
          <img
            src="https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&q=80&w=2000"
            alt="Shopping Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Explora las mejores <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-500">ofertas</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-300 mb-6">
            Encuentra descuentos increíbles en alimentación, tecnología, entretenimiento y mucho más.
          </p>

          {/* Barra de búsqueda dentro del hero */}
          <div className="max-w-lg mx-auto relative mt-4">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveCategory("Todas"); }}
              placeholder="Buscar por oferta, empresa o categoría..."
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl text-sm bg-white/10 dark:bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {!isAuthenticated && !search && (
            <div className="mt-5 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm px-5 py-2.5 rounded-full">
              <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Registrate gratis para adquirir cupones</span>
              <button onClick={() => navigate("/register")} className="ml-1 text-rose-300 font-semibold hover:text-rose-200 underline underline-offset-2">
                Crear cuenta
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">

        {/* Filtros de categoría (solo si no hay búsqueda activa) */}
        {!loading && !searchTerm && categories.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeCategory === cat
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/20 transform scale-105"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-16">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-slate-800 rounded-3xl h-[400px] shadow-sm border border-slate-100 dark:border-slate-700 p-4">
                <div className="bg-slate-200 dark:bg-slate-700 h-48 rounded-2xl mb-4"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-6"></div>
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-full"></div>
              </div>
            ))}
          </div>
        )}

        {/* Resultados de búsqueda (flat list) */}
        {!loading && searchTerm && (
          <div className="mb-16 mt-6">
            <div className="flex items-center mb-6">
              <div className="w-2 h-8 rounded-full bg-gradient-to-b from-rose-500 to-red-600 mr-3"></div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {searchResults.length === 0
                  ? `Sin resultados para "${search}"`
                  : `${searchResults.length} resultado${searchResults.length !== 1 ? "s" : ""} para "${search}"`}
              </h2>
            </div>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map(renderOfferCard)}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-slate-500 dark:text-slate-400">No encontramos ofertas que coincidan.</p>
                <button onClick={() => setSearch("")} className="mt-4 text-rose-500 font-semibold hover:underline text-sm">
                  Limpiar búsqueda
                </button>
              </div>
            )}
          </div>
        )}

        {/* Grid de ofertas agrupado por categoría */}
        {!loading && !searchTerm && Object.entries(groupedOffers).map(([category, offers]) => {
          if (activeCategory !== "Todas" && activeCategory !== category) return null;
          return (
            <div key={category} className="mb-16">
              <div className="flex items-center mb-6">
                <div className="w-2 h-8 rounded-full bg-gradient-to-b from-rose-500 to-red-600 mr-3"></div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{category}</h2>
                <div className="ml-4 flex-grow h-px bg-gradient-to-r from-slate-200 dark:from-slate-700 to-transparent"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {offers.map(renderOfferCard)}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {!loading && !searchTerm && Object.keys(groupedOffers).length === 0 && (
          <div className="text-center py-32">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 mb-6">
              <svg className="w-12 h-12 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">No hay ofertas disponibles</h3>
            <p className="text-slate-500 dark:text-slate-400">Parece que no tenemos ofertas para mostrarte en este momento.</p>
          </div>
        )}
      </div>

      {/* Modal de pago */}
      {selectedOffer && (
        <PaymentModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
          onConfirm={handlePaymentConfirm}
        />
      )}
    </div>
  );
}

export default Offers;
