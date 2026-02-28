import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/auth.context';
import { useActivity } from '@/features/dashboard/activity.context';

const CartContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
    return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const { logActivity } = useActivity();
    const [cartItems, setCartItems] = useState([]);

    // Cargar carrito cuando cambia el usuario
    useEffect(() => {
        if (user && user.email) {
            const cartKey = `cart_${user.email}`;
            const storedCart = localStorage.getItem(cartKey);
            if (storedCart) {
                try {
                    // eslint-disable-next-line react-hooks/set-state-in-effect
                    setCartItems(JSON.parse(storedCart));
                } catch (e) {
                    console.error("Error parsing cart", e);
                    setCartItems([]);
                }
            } else {
                setCartItems([]);
            }
        } else {
            setCartItems([]);
        }
    }, [user]);

    // Sincronizar con localStorage cuando cartItems cambia y hay un usuario
    useEffect(() => {
        if (user && user.email) {
            const cartKey = `cart_${user.email}`;
            localStorage.setItem(cartKey, JSON.stringify(cartItems));
        }
    }, [cartItems, user]);

    const addToCart = (product) => {
        setCartItems((prevItems) => {
            const cartItemId = product.size ? `${product.id}-${product.size}` : product.id;
            const existingItem = prevItems.find(item => (item.cartItemId || item.id) === cartItemId);

            if (existingItem) {
                return prevItems.map(item =>
                    (item.cartItemId || item.id) === cartItemId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...prevItems, { ...product, quantity: 1, cartItemId }];
            }
        });
        const sizeText = product.size ? ` (${product.size})` : '';
        logActivity('add_cart', 'Producto añadido', `Has añadido ${product.name}${sizeText} al carrito`);
    };

    const removeFromCart = (targetId) => {
        setCartItems((prevItems) => {
            const item = prevItems.find(i => (i.cartItemId || i.id) === targetId);
            if (item) {
                const sizeText = item.size ? ` (${item.size})` : '';
                logActivity('remove_cart', 'Producto removido', `Has quitado ${item.name}${sizeText} del carrito`);
            }
            return prevItems.filter(i => (i.cartItemId || i.id) !== targetId);
        });
    };

    const updateQuantity = (targetId, newQuantity) => {
        if (newQuantity < 1) return;
        setCartItems((prevItems) =>
            prevItems.map(item =>
                (item.cartItemId || item.id) === targetId
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
        logActivity('clear_cart', 'Carrito vaciado', 'Has eliminado todos los productos del carrito');
    };

    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    const cartTotal = cartItems.reduce((total, item) => {
        return total + (parseFloat(item.price) * item.quantity);
    }, 0);

    const value = {
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
