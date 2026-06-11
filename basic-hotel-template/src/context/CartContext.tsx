"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { FoodItem } from "@/types/kitchen";
export interface CartItem {
  foodItem: FoodItem;
  quantity: number;
  special_note?: string;
}
interface CartContextType {
  cart: CartItem[];
  addToCart: (item: FoodItem, quantity?: number, special_note?: string) => void;
  removeFromCart: (foodItemId: number) => void;
  updateQuantity: (foodItemId: number, quantity: number) => void;
  updateSpecialNote: (foodItemId: number, note: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}
const CartContext = createContext<CartContextType | undefined>(undefined);
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hotel_kitchen_cart");
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        // silent
      }
    }
  }, []);
  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("hotel_kitchen_cart", JSON.stringify(cart));
  }, [cart]);
  const addToCart = (foodItem: FoodItem, quantity = 1, special_note = "") => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.foodItem.id === foodItem.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += quantity;
        if (special_note) updated[idx].special_note = special_note;
        return updated;
      }
      return [...prev, { foodItem, quantity, special_note }];
    });
  };
  const removeFromCart = (foodItemId: number) => {
    setCart((prev) => prev.filter((i) => i.foodItem.id !== foodItemId));
  };
  const updateQuantity = (foodItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(foodItemId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.foodItem.id === foodItemId ? { ...i, quantity } : i))
    );
  };
  const updateSpecialNote = (foodItemId: number, note: string) => {
    setCart((prev) =>
      prev.map((i) =>
        i.foodItem.id === foodItemId ? { ...i, special_note: note } : i
      )
    );
  };
  const clearCart = () => setCart([]);
  const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);
  const totalPrice = cart.reduce((acc, i) => acc + Number(i.foodItem.price) * i.quantity, 0);
  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateSpecialNote,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}