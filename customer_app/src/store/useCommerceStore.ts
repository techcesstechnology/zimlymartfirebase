import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Location, CartItem } from '../types/commerce';

interface CommerceState {
    location: Location | null;
    setLocation: (location: Location) => void;
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (variantId: string) => void;
    clearCart: () => void;
}

export const useCommerceStore = create<CommerceState>()(
    persist(
        (set) => ({
            location: null,
            setLocation: (location) => set({ location }),
            cart: [],
            addToCart: (item) => set((state) => {
                const existing = state.cart.find(i => i.variantId === item.variantId);
                if (existing) {
                    return {
                        cart: state.cart.map(i => i.variantId === item.variantId
                            ? { ...i, quantity: i.quantity + item.quantity }
                            : i
                        )
                    };
                }
                return { cart: [...state.cart, item] };
            }),
            removeFromCart: (variantId) => set((state) => ({
                cart: state.cart.filter(i => i.variantId !== variantId)
            })),
            clearCart: () => set({ cart: [] }),
        }),
        {
            name: 'zimlymart-storage',
        }
    )
);
