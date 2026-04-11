import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
 * Store del carrito de compras.
 *
 * Usa el middleware 'persist' de Zustand para guardar el carrito en localStorage
 * con la clave 'cuponera-cart'. Así el contenido sobrevive recargas de página.
 *
 * Estructura de cada item: { offer: <objeto oferta completo>, quantity: number }
 *
 * El carrito solo existe en el frontend; la compra real se procesa cuando el
 * usuario confirma en el checkout y se llama a POST /api/purchases por cada item.
 */
const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // Agrega una oferta al carrito. Si ya existe, suma la cantidad en lugar de duplicar.
      addToCart: (offer, quantity = 1) => {
        const items = get().items;
        const existing = items.find(i => i.offer.id === offer.id);
        if (existing) {
          set({
            items: items.map(i =>
              i.offer.id === offer.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, { offer, quantity }] });
        }
      },

      removeFromCart: (offerId) => {
        set({ items: get().items.filter(i => i.offer.id !== offerId) });
      },

      // Si la cantidad baja a 0 o menos, elimina el item directamente
      updateQuantity: (offerId, quantity) => {
        if (quantity < 1) {
          set({ items: get().items.filter(i => i.offer.id !== offerId) });
          return;
        }
        set({
          items: get().items.map(i =>
            i.offer.id === offerId ? { ...i, quantity } : i
          ),
        });
      },

      // Vacía el carrito completo (se usa después de completar el checkout)
      clearCart: () => set({ items: [] }),

      // Total en dólares de todos los items
      get total() {
        return get().items.reduce(
          (sum, i) => sum + i.offer.offer_price * i.quantity,
          0
        );
      },

      // Cantidad total de cupones en el carrito (suma de quantities)
      get count() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    { name: "cuponera-cart" } // clave en localStorage
  )
);

export default useCartStore;
