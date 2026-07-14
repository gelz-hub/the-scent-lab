'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Product, VolumeOption } from '@/lib/data'
import type { AppliedCoupon } from '@/lib/checkout/pricing'

export interface CartLine {
  productId: string
  slug: string
  name: string
  brand: string
  image: string
  volume: VolumeOption
  qty: number
}

interface StoreState {
  // Cart
  cart: CartLine[]
  cartOpen: boolean
  addToCart: (product: Product, volume: VolumeOption, qty?: number) => void
  /** Same merge behavior as addToCart, for callers (Buy Again) that already have a CartLine-shaped payload instead of a full Product. */
  addCartLine: (line: Omit<CartLine, 'qty'>, qty?: number) => void
  removeFromCart: (productId: string, ml: number) => void
  updateQty: (productId: string, ml: number, qty: number) => void
  clearCart: () => void
  setCartOpen: (open: boolean) => void

  // Wishlist — persisted to localStorage for guests, synced to the DB via
  // /api/wishlist (best-effort, fire-and-forget) whenever a session exists.
  // See src/lib/account/wishlist-service.ts.
  wishlist: string[] // product ids
  wishlistOpen: boolean
  toggleWishlist: (productId: string) => void
  isWishlisted: (productId: string) => boolean
  setWishlistOpen: (open: boolean) => void
  /** Replaces the wishlist wholesale — used to hydrate from the DB on login (see WishlistSync). */
  hydrateWishlist: (productIds: string[]) => void

  // Recently viewed
  recentlyViewed: string[]
  addRecentlyViewed: (productId: string) => void

  // Search
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void

  // Mobile nav
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void

  // Promo — server-validated, see src/lib/checkout/coupon-service.ts. Never
  // trust a coupon client-side only: order creation re-validates the code
  // itself and ignores whatever discount the client thinks it computed.
  promo: AppliedCoupon | null
  applyPromo: (code: string, subtotal: number) => Promise<{ ok: boolean; error?: string }>
  removePromo: () => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      cartOpen: false,
      addToCart: (product, volume, qty = 1) => {
        set((s) => {
          const idx = s.cart.findIndex(
            (l) => l.productId === product.id && l.volume.ml === volume.ml
          )
          if (idx >= 0) {
            const cart = [...s.cart]
            cart[idx] = { ...cart[idx], qty: cart[idx].qty + qty }
            return { cart, cartOpen: true }
          }
          return {
            cart: [
              ...s.cart,
              {
                productId: product.id,
                slug: product.slug,
                name: product.name,
                brand: product.brand,
                image: product.image,
                volume,
                qty,
              },
            ],
            cartOpen: true,
          }
        })
      },
      addCartLine: (line, qty = 1) => {
        set((s) => {
          const idx = s.cart.findIndex((l) => l.productId === line.productId && l.volume.ml === line.volume.ml)
          if (idx >= 0) {
            const cart = [...s.cart]
            cart[idx] = { ...cart[idx], qty: cart[idx].qty + qty }
            return { cart, cartOpen: true }
          }
          return { cart: [...s.cart, { ...line, qty }], cartOpen: true }
        })
      },
      removeFromCart: (productId, ml) =>
        set((s) => ({
          cart: s.cart.filter(
            (l) => !(l.productId === productId && l.volume.ml === ml)
          ),
        })),
      updateQty: (productId, ml, qty) =>
        set((s) => ({
          cart: s.cart
            .map((l) =>
              l.productId === productId && l.volume.ml === ml
                ? { ...l, qty: Math.max(1, qty) }
                : l
            )
            .filter((l) => l.qty > 0),
        })),
      clearCart: () => set({ cart: [] }),
      setCartOpen: (open) => set({ cartOpen: open }),

      wishlist: [],
      wishlistOpen: false,
      toggleWishlist: (productId) => {
        set((s) => ({
          wishlist: s.wishlist.includes(productId)
            ? s.wishlist.filter((id) => id !== productId)
            : [...s.wishlist, productId],
        }))
        // Best-effort DB sync — a guest (no session) gets a 401 and the
        // local/localStorage state above is still the source of truth for
        // them, exactly as before this sync was added.
        fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        }).catch(() => {})
      },
      isWishlisted: (productId) => get().wishlist.includes(productId),
      setWishlistOpen: (open) => set({ wishlistOpen: open }),
      hydrateWishlist: (productIds) => set({ wishlist: productIds }),

      recentlyViewed: [],
      addRecentlyViewed: (productId) =>
        set((s) => ({
          recentlyViewed: [
            productId,
            ...s.recentlyViewed.filter((id) => id !== productId),
          ].slice(0, 8),
        })),

      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open }),

      mobileNavOpen: false,
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

      promo: null,
      applyPromo: async (code, subtotal) => {
        try {
          const res = await fetch('/api/coupons/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, subtotal }),
          })
          const data = await res.json()
          if (!data.valid || !data.coupon) {
            return { ok: false, error: data.error || 'Invalid coupon code.' }
          }
          set({ promo: data.coupon })
          return { ok: true }
        } catch {
          return { ok: false, error: 'Could not validate coupon. Please try again.' }
        }
      },
      removePromo: () => set({ promo: null }),
    }),
    {
      name: 'scentlab-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        cart: s.cart,
        wishlist: s.wishlist,
        recentlyViewed: s.recentlyViewed,
        promo: s.promo,
      }),
    }
  )
)

// Derived selectors (plain functions to keep it simple)
export const cartCount = (cart: CartLine[]) =>
  cart.reduce((sum, l) => sum + l.qty, 0)

export const cartSubtotal = (cart: CartLine[]) =>
  cart.reduce((sum, l) => sum + l.volume.price * l.qty, 0)
