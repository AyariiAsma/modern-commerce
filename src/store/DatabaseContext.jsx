import React, { createContext, useContext, useState, useEffect } from 'react';
import { productService, categoryService, orderService, settingsService } from '../services/api';

const DatabaseContext = createContext();

export const useDatabase = () => {
    const context = useContext(BaseDatabaseContext());
    // Safe wrapper check
    const checkContext = useContext(DatabaseContext);
    if (!checkContext) {
        throw new Error('useDatabase must be used within a DatabaseProvider');
    }
    return checkContext;
};

// Safe placeholder to avoid syntax error
function BaseDatabaseContext() {
    return DatabaseContext;
}

export const DatabaseProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        currency: 'DZD',
        shippingFee: 15.00,
        cashOnDeliveryOnly: true
    });
    const [loyaltySettings, setLoyaltySettings] = useState({});

    const fetchProducts = async () => {
        try {
            const res = await productService.getAll();
            setProducts(res.data);
        } catch (err) {
            console.error('Failed to fetch products from API:', err);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await categoryService.getAll();
            setCategories(res.data);
        } catch (err) {
            console.error('Failed to fetch categories from API:', err);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await orderService.getAll();
            setOrders(res.data);
        } catch (err) {
            console.error('Failed to fetch orders from API:', err);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await settingsService.getSettings();
            if (res.data.settings?.general) {
                setSettings({
                    currency: res.data.settings.general.currency || 'DZD',
                    shippingFee: parseFloat(res.data.settings.general.shippingFee || 15.00),
                    cashOnDeliveryOnly: res.data.settings.general.cashOnDeliveryOnly === 'true'
                });
            }
        } catch (err) {
            console.error('Failed to fetch settings from API:', err);
        }
    };

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await Promise.all([fetchProducts(), fetchCategories(), fetchSettings()]);
            // Only try to fetch orders if we have a token
            if (localStorage.getItem('ecomm_token')) {
                await fetchOrders();
            }
            setLoading(false);
        };
        loadInitialData();
    }, []);

    // Refetch orders when token changes (login/logout events)
    useEffect(() => {
        const token = localStorage.getItem('ecomm_token');
        if (token) {
            fetchOrders();
        } else {
            setOrders([]);
        }
    }, [localStorage.getItem('ecomm_token')]);

    // Product CRUD Operations
    const addProduct = async (productData) => {
        try {
            const res = await productService.create(productData);
            await fetchProducts();
            return res.data;
        } catch (err) {
            console.error('Failed to add product via API:', err);
            throw err;
        }
    };

    const updateProduct = async (id, updatedData) => {
        try {
            await productService.update(id, updatedData);
            await fetchProducts();
        } catch (err) {
            console.error('Failed to update product via API:', err);
            throw err;
        }
    };

    const deleteProduct = async (id) => {
        try {
            await productService.delete(id);
            await fetchProducts();
        } catch (err) {
            console.error('Failed to delete product via API:', err);
            throw err;
        }
    };

    // Category CRUD Operations
    const addCategory = async (categoryData) => {
        try {
            const res = await categoryService.create(categoryData);
            await fetchCategories();
            return res.data;
        } catch (err) {
            console.error('Failed to add category via API:', err);
            throw err;
        }
    };

    const updateCategory = async (id, updatedData) => {
        try {
            await categoryService.update(id, updatedData);
            await fetchCategories();
        } catch (err) {
            console.error('Failed to update category via API:', err);
            throw err;
        }
    };

    const deleteCategory = async (id) => {
        try {
            await categoryService.delete(id);
            await fetchCategories();
        } catch (err) {
            console.error('Failed to delete category via API:', err);
            throw err;
        }
    };

    // Order Operations
    const addOrder = async (orderData) => {
        try {
            const res = await orderService.create(orderData);
            if (localStorage.getItem('ecomm_token')) {
                await fetchOrders();
            }
            return res.data;
        } catch (err) {
            console.error('Failed to place order via API:', err);
            throw err;
        }
    };

    const updateOrderStatus = async (id, status) => {
        try {
            await orderService.updateStatus(id, status);
            if (localStorage.getItem('ecomm_token')) {
                await fetchOrders();
            }
        } catch (err) {
            console.error('Failed to update order status via API:', err);
            throw err;
        }
    };

    // Update settings configuration via API
    const updateSettings = async (newSettings) => {
        try {
            // Convert boolean to string for DB
            const payload = [
                { key: 'currency', value: newSettings.currency, group: 'general' },
                { key: 'shippingFee', value: String(newSettings.shippingFee), group: 'general' },
                { key: 'cashOnDeliveryOnly', value: String(newSettings.cashOnDeliveryOnly), group: 'general' }
            ];
            await settingsService.updateSettings(payload);
            setSettings({
                ...settings,
                ...newSettings,
                shippingFee: parseFloat(newSettings.shippingFee)
            });
        } catch (err) {
            console.error('Failed to update settings API', err);
            throw err;
        }
    };

    const value = {
        products,
        categories,
        orders,
        settings,
        loading,
        refetchProducts: fetchProducts,
        refetchCategories: fetchCategories,
        refetchOrders: fetchOrders,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        addOrder,
        updateOrderStatus,
        updateSettings
    };

    return (
        <DatabaseContext.Provider value={value}>
            {!loading && children}
        </DatabaseContext.Provider>
    );
};

