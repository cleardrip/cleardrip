// context/CartContext.tsx - User-specific version
"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    discount?: number;
    image?: string;
    quantity: number;
    rating?: number;
    reviewCount?: number;
}

interface CartContextType {
    cartItems: CartItem[];
    cartCount: number;
    addToCart: (item: Omit<CartItem, 'quantity'>) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    getTotalAmount: () => number;
    getTotalMRP: () => number;
    getTotalDiscount: () => number;
    loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const { user, authenticated, authLoading } = useAuth();

    // Generate user-specific cart key
    const getCartKey = useCallback(() => {
        if (!authenticated || !user) {
            return 'cart_guest'; // For non-authenticated users
        }
        // Use user ID if available, otherwise use email as fallback
        const userIdentifier = user.id || user.email;
        return `cart_${userIdentifier}`;
    }, [authenticated, user]);

    // Load cart from localStorage when user changes or component mounts
    useEffect(() => {
        // Don't load cart while auth is still loading
        if (authLoading) return;

        setLoading(true);
        const cartKey = getCartKey();
        const savedCart = localStorage.getItem(cartKey);

        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                // Validate that parsed cart is an array
                if (Array.isArray(parsedCart)) {
                    setCartItems(parsedCart);
                } else {
                    console.warn('Invalid cart data found, resetting cart');
                    setCartItems([]);
                }
            } catch (error) {
                console.error('Failed to parse saved cart:', error);
                setCartItems([]);
            }
        } else {
            // No saved cart found, start with empty cart
            setCartItems([]);
        }

        setLoading(false);
    }, [getCartKey, authLoading]);

    // Clear cart when user logs out
    useEffect(() => {
        if (!authLoading && !authenticated) {
            setCartItems([]);
        }
    }, [authenticated, authLoading]);

    // Save cart to localStorage whenever cartItems changes
    useEffect(() => {
        // Don't save while auth is loading
        if (authLoading) return;

        const cartKey = getCartKey();
        try {
            localStorage.setItem(cartKey, JSON.stringify(cartItems));
        } catch (error) {
            console.error('Failed to save cart to localStorage:', error);
        }
    }, [cartItems, getCartKey, authLoading]);

    const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                return prevItems.map(cartItem =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            }
            return [...prevItems, { ...item, quantity: 1 }];
        });
    }, []);

    const removeFromCart = useCallback((id: string) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    }, []);

    const updateQuantity = useCallback((id: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(id);
            return;
        }
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, quantity } : item
            )
        );
    }, [removeFromCart]);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    const getTotalMRP = useCallback(() => {
        return cartItems.reduce((total, item) => total + (item.originalPrice * item.quantity), 0);
    }, [cartItems]);

    const getTotalDiscount = useCallback(() => {
        return cartItems.reduce((total, item) => total + ((item.originalPrice - item.price) * item.quantity), 0);
    }, [cartItems]);

    const getTotalAmount = useCallback(() => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    }, [cartItems]);

    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            cartCount,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getTotalAmount,
            getTotalMRP,
            getTotalDiscount,
            loading
        }}>
            {children}
        </CartContext.Provider>
    );
};