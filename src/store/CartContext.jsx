import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDatabase } from './DatabaseContext';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { addOrder, updateProduct, products } = useDatabase();
    const { user } = useAuth();
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('ecomm_cart');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('ecomm_cart', JSON.stringify(cart));
    }, [cart]);

    // Cart operations
    const addToCart = (product, quantity = 1) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === product.id);
            if (existingItem) {
                // Check stock
                const totalQty = existingItem.quantity + quantity;
                if (totalQty > product.stock) {
                    alert(`Only ${product.stock} items available in stock.`);
                    return prevCart.map(item =>
                        item.productId === product.id ? { ...item, quantity: product.stock } : item
                    );
                }
                return prevCart.map(item =>
                    item.productId === product.id ? { ...item, quantity: totalQty } : item
                );
            }
            return [...prevCart, {
                productId: product.id,
                name: product.name,
                price: product.discountPrice !== null ? product.discountPrice : product.price,
                quantity: Math.min(quantity, product.stock),
                image: product.image,
                category: product.category
            }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        const availableStock = product.stock;
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

    // Place order
    const checkout = (shippingAddress, paymentMethod) => {
        if (cart.length === 0) return { success: false, error: 'Cart is empty' };

        // Group items and calculate subtotal
        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create order structure
        const orderData = {
            userId: user ? user.id : 'guest',
            customerName: user ? user.name : 'Guest Customer',
            customerEmail: user ? user.email : 'guest@example.com',
            items: [...cart],
            totalAmount,
            paymentMethod,
            shippingAddress
        };

        // Commit order
        const createdOrder = addOrder(orderData);

        // Deduct stock
        cart.forEach(item => {
            const prod = products.find(p => p.id === item.productId);
            if (prod) {
                updateProduct(item.productId, {
                    ...prod,
                    stock: Math.max(0, prod.stock - item.quantity)
                });
            }
        });

        clearCart();
        return { success: true, order: createdOrder };
    };

    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        checkout,
        cartCount,
        cartTotal
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
