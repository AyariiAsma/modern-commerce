import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5001/api'
});

// Request interceptor to automatically attach JWT token if available
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('ecomm_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const authService = {
    login: async (email, password) => {
        const response = await API.post('/auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('ecomm_token', response.data.token);
        }
        return response;
    },

    register: async (name, email, password, phone) => {
        const response = await API.post('/auth/register', { name, email, password, phone });
        if (response.data.token) {
            localStorage.setItem('ecomm_token', response.data.token);
        }
        return response;
    },

    logout: async () => {
        localStorage.removeItem('ecomm_token');
        return { data: { success: true } };
    },

    getMe: async () => {
        return await API.get('/auth/me');
    },

    updateMe: async (profileData) => {
        return await API.put('/auth/me', profileData);
    }
};

export const productService = {
    getAll: async (params = {}) => {
        return await API.get('/products', { params });
    },

    getById: async (id) => {
        return await API.get(`/products/${id}`);
    },

    create: async (productData) => {
        return await API.post('/products', productData);
    },

    update: async (id, updatedData) => {
        return await API.put(`/products/${id}`, updatedData);
    },

    delete: async (id) => {
        return await API.delete(`/products/${id}`);
    }
};

export const categoryService = {
    getAll: async () => {
        return await API.get('/categories');
    },

    create: async (categoryData) => {
        return await API.post('/categories', categoryData);
    },

    update: async (id, updatedData) => {
        return await API.put(`/categories/${id}`, updatedData);
    },

    delete: async (id) => {
        return await API.delete(`/categories/${id}`);
    }
};

export const bannerService = {
    getActive: async () => {
        return await API.get('/banners');
    },

    getAll: async () => {
        return await API.get('/banners/all');
    },

    create: async (bannerData) => {
        return await API.post('/banners', bannerData);
    },

    update: async (id, updatedData) => {
        return await API.put(`/banners/${id}`, updatedData);
    },

    delete: async (id) => {
        return await API.delete(`/banners/${id}`);
    }
};

export const addressService = {
    getAll: async () => {
        return await API.get('/addresses');
    },

    create: async (addressData) => {
        return await API.post('/addresses', addressData);
    },

    update: async (id, updatedData) => {
        return await API.put(`/addresses/${id}`, updatedData);
    },

    delete: async (id) => {
        return await API.delete(`/addresses/${id}`);
    },

    setDefault: async (id) => {
        return await API.put(`/addresses/${id}/default`);
    }
};

export const orderService = {
    getAll: async (params = {}) => {
        return await API.get('/orders', { params });
    },

    getById: async (id) => {
        return await API.get(`/orders/${id}`);
    },

    create: async (orderData) => {
        return await API.post('/orders', orderData);
    },

    updateStatus: async (id, status) => {
        return await API.put(`/orders/${id}/status`, { status });
    },

    updatePaymentStatus: async (id, paymentStatus) => {
        return await API.put(`/orders/${id}/payment`, { payment_status: paymentStatus });
    }
};

export const adminService = {
    getStats: async () => {
        return await API.get('/admin/stats');
    }
};

export const settingsService = {
    getSettings: async () => {
        return await API.get('/settings');
    },
    updateSettings: async (settings) => {
        return await API.put('/settings', { settings });
    },
    getLoyaltySettings: async () => {
        return await API.get('/settings/loyalty');
    },
    updateLoyaltySettings: async (data) => {
        return await API.put('/settings/loyalty', data);
    }
};

export const stockService = {
    getLocations: async () => {
        return await API.get('/stock/locations');
    },
    getProductStock: async (productId) => {
        return await API.get(`/stock/${productId}`);
    },
    getMovements: async (productId, limit = 20) => {
        return await API.get(`/stock/${productId}/movements?limit=${limit}`);
    },
    adjustStock: async (data) => {
        return await API.post('/stock/adjust', data);
    }
};

export const promotionsService = {
    getAll: async () => {
        return await API.get('/promotions');
    },
    getById: async (id) => {
        return await API.get(`/promotions/${id}`);
    },
    create: async (data) => {
        return await API.post('/promotions', data);
    },
    update: async (id, data) => {
        return await API.put(`/promotions/${id}`, data);
    },
    delete: async (id) => {
        return await API.delete(`/promotions/${id}`);
    }
};

export const invoiceService = {
    getAll: async () => {
        return await API.get('/invoices');
    },
    getCreditNotes: async () => {
        return await API.get('/invoices/credit-notes');
    },
    issueCreditNote: async (data) => {
        return await API.post('/invoices/credit-notes', data);
    }
};

export const loyaltyService = {
    // Customer
    getMyLoyalty: async () => {
        return await API.get('/loyalty/me');
    },
    getMyLoyaltyStatus: async () => {
        return await API.get('/loyalty/status');
    },
    validateCode: async (code) => {
        return await API.post('/loyalty/validate', { code });
    },
    // Admin
    getSettings: async () => {
        return await API.get('/loyalty/settings');
    },
    updateSettings: async (settingsData) => {
        return await API.put('/loyalty/settings', settingsData);
    },
    getProgress: async () => {
        return await API.get('/loyalty/progress');
    },
    getCodes: async () => {
        return await API.get('/loyalty/codes');
    },
    cancelCode: async (id) => {
        return await API.put(`/loyalty/codes/${id}/cancel`);
    }
};

export const mediaService = {
    upload: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return await API.post('/media/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    delete: async (id) => {
        return await API.delete(`/media/${id}`);
    }
};

export default API;
