import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Location, CartItem } from '../types/commerce';

interface CommerceState {
    location: Location | null;
    setLocation: (location: Location) => void;
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (lineId: string) => void;
    clearCart: () => void;
}

export const useCommerceStore = create<CommerceState>()(
    persist(
        (set) => ({
            location: null,
            setLocation: (location) => set({ location }),
            cart: [],
            addToCart: (item) => set((state) => {
                const existing = state.cart.find(i => i.lineId === item.lineId);
                if (existing) {
                    return {
                        cart: state.cart.map(i => i.lineId === item.lineId
                            ? { ...i, quantity: i.quantity + item.quantity } as CartItem
                            : i
                        )
                    };
                }
                return { cart: [...state.cart, item] };
            }),
            removeFromCart: (lineId) => set((state) => ({
                cart: state.cart.filter(i => i.lineId !== lineId)
            })),
            clearCart: () => set({ cart: [] }),
        }),
        {
            name: 'zimlymart-storage',
        }
    )
);
