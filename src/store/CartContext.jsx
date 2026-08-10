import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDatabase } from './DatabaseContext';
import { useAuth } from './AuthContext';
import { orderService } from '../services/api';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

// Normalize product fields from DB (stock_quantity, discount_price) or legacy mock names
const getStock = (product) => product.stock_quantity !== undefined ? product.stock_quantity : (product.stock || 0);
const getEffectivePrice = (product) => {
    const dp = product.discount_price !== undefined ? product.discount_price : product.discountPrice;
    const hasDiscount = dp !== null && dp !== undefined && parseFloat(dp) > 0;
    return hasDiscount ? parseFloat(dp) : parseFloat(product.price);
};
const getCategoryLabel = (product) => product.category_name || product.category_slug || product.category || '';

export const CartProvider = ({ children }) => {
    const { products } = useDatabase();
    const { user } = useAuth();
    const [cart, setCart] = useState(() => {
        try {
            const saved = localStorage.getItem('ecomm_cart');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('ecomm_cart', JSON.stringify(cart));
    }, [cart]);

    // Cart operations
    const addToCart = (product, quantity = 1) => {
        const stockQty = getStock(product);
        const price = getEffectivePrice(product);
        const category = getCategoryLabel(product);

        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === product.id);
            if (existingItem) {
                const totalQty = existingItem.quantity + quantity;
                if (totalQty > stockQty) {
                    alert(`Only ${stockQty} items available in stock.`);
                    return prevCart.map(item =>
                        item.productId === product.id ? { ...item, quantity: stockQty } : item
                    );
                }
                return prevCart.map(item =>
                    item.productId === product.id ? { ...item, quantity: totalQty } : item
                );
            }
            return [...prevCart, {
                productId: product.id,
                name: product.name,
                price,
                tva_rate: product.tva_rate || 0,
                quantity: Math.min(quantity, stockQty),
                image: product.image,
                category
            }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        // Find by both int and string id comparison
        const product = products.find(p => String(p.id) === String(productId));
        if (!product) return;

        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        const availableStock = getStock(product);
        if (quantity > availableStock) {
            alert(`Only ${availableStock} items available in stock.`);
            quantity = availableStock;
        }

        setCart(prev => prev.map(item =>
            item.productId === productId ? { ...item, quantity } : item
        ));
    };

    const clearCart = () => {
        setCart([]);
    };

    // Place order via REST API
    const checkout = async (checkoutData) => {
        if (cart.length === 0) return { success: false, error: 'Cart is empty' };

        try {
            const orderPayload = {
                address_id: checkoutData.address_id || null,
                address_details: checkoutData.address_details || null,
                save_address: checkoutData.save_address || false,
                payment_method: checkoutData.payment_method,
                discount: checkoutData.discount || 0,
                shipping_cost: checkoutData.shipping_cost || 0,
                promo_code: checkoutData.promo_code || null,
                items: cart.map(item => ({
                    product_id: item.productId,
                    quantity: item.quantity
                }))
            };

            const res = await orderService.create(orderPayload);
            clearCart();
            return { success: true, order: res.data };
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to place order.';
            return { success: false, error: msg };
        }
    };

    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
    const cartTotalHt = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartTotalTva = cart.reduce((total, item) => {
        const itemHt = item.price * item.quantity;
        const rate = (item.tva_rate || 0) / 100;
        return total + (itemHt * rate);
    }, 0);
    const cartTotal = cartTotalHt + cartTotalTva;

    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        checkout,
        cartCount,
        cartTotal,
        cartTotalHt,
        cartTotalTva
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
