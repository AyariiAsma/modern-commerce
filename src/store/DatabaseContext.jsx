import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_USERS, INITIAL_ORDERS } from './MockDatabase';

const DatabaseContext = createContext();

export const useDatabase = () => {
    const context = useContext(DatabaseContext);
    if (!context) {
        throw new Error('useDatabase must be used within a DatabaseProvider');
    }
    return context;
};

export const DatabaseProvider = ({ children }) => {
    // Inventory Products State
    const [products, setProducts] = useState(() => {
        const saved = localStorage.getItem('ecomm_products');
        return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    });

    // Categories Taxonomy State
    const [categories, setCategories] = useState(() => {
        const saved = localStorage.getItem('ecomm_categories');
        return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    });

    // User Directory State
    const [users, setUsers] = useState(() => {
        const saved = localStorage.getItem('ecomm_users');
        return saved ? JSON.parse(saved) : INITIAL_USERS;
    });

    // Invoices Orders State
    const [orders, setOrders] = useState(() => {
        const saved = localStorage.getItem('ecomm_orders');
        return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    });

    // Global Store Control Settings
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('ecomm_settings');
        return saved ? JSON.parse(saved) : {
            currency: 'DZD',
            shippingFee: 15.00,
            cashOnDeliveryOnly: true
        };
    });

    // Sync to localStorage
    useEffect(() => {
        localStorage.setItem('ecomm_products', JSON.stringify(products));
    }, [products]);

    useEffect(() => {
        localStorage.setItem('ecomm_categories', JSON.stringify(categories));
    }, [categories]);

    useEffect(() => {
        localStorage.setItem('ecomm_users', JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        localStorage.setItem('ecomm_orders', JSON.stringify(orders));
    }, [orders]);

    useEffect(() => {
        localStorage.setItem('ecomm_settings', JSON.stringify(settings));
    }, [settings]);

    // Product CRUD Operations
    const addProduct = (productData) => {
        const newProduct = {
            ...productData,
            id: `prod_${Date.now()}`,
            rating: 5.0,
            reviewsCount: 0,
            price: parseFloat(productData.price),
            discountPrice: productData.discountPrice ? parseFloat(productData.discountPrice) : null,
            stock: parseInt(productData.stock, 10),
            featured: productData.featured || false
        };
        setProducts(prev => [newProduct, ...prev]);
        return newProduct;
    };

    const updateProduct = (id, updatedData) => {
        setProducts(prev => prev.map(p => {
            if (p.id === id) {
                return {
                    ...p,
                    ...updatedData,
                    price: parseFloat(updatedData.price),
                    discountPrice: updatedData.discountPrice ? parseFloat(updatedData.discountPrice) : null,
                    stock: parseInt(updatedData.stock, 10)
                };
            }
            return p;
        }));
    };

    const deleteProduct = (id) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    // Category CRUD Operations
    const addCategory = (categoryData) => {
        const newCategory = {
            ...categoryData,
            id: `cat_${Date.now()}`,
            slug: categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        };
        setCategories(prev => [...prev, newCategory]);
        return newCategory;
    };

    const updateCategory = (id, updatedData) => {
        setCategories(prev => prev.map(c => {
            if (c.id === id) {
                return {
                    ...c,
                    ...updatedData,
                    slug: (updatedData.name || c.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')
                };
            }
            return c;
        }));
    };

    const deleteCategory = (id) => {
        setCategories(prev => prev.filter(c => c.id !== id));
    };

    // Order Operations
    const addOrder = (orderData) => {
        const newOrder = {
            ...orderData,
            id: `ord_${Date.now()}`,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };
        setOrders(prev => [newOrder, ...prev]);
        return newOrder;
    };

    const updateOrderStatus = (id, status) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    };

    // User Operations
    const addCustomer = (userData) => {
        const newUser = {
            ...userData,
            id: `user_${Date.now()}`,
            role: 'customer',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
        };
        setUsers(prev => [...prev, newUser]);
        return newUser;
    };

    // Update settings configuration
    const updateSettings = (newSettings) => {
        setSettings(prev => ({
            ...prev,
            ...newSettings,
            shippingFee: parseFloat(newSettings.shippingFee)
        }));
    };

    const value = {
        products,
        categories,
        users,
        orders,
        settings,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        addOrder,
        updateOrderStatus,
        addCustomer,
        updateSettings
    };

    return (
        <DatabaseContext.Provider value={value}>
            {children}
        </DatabaseContext.Provider>
    );
};
