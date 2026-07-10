// Mock API endpoints simulating Axios requests
// In a real application, you would import axios and make requests to a base URL:
// import axios from 'axios';
// const API = axios.create({ baseURL: 'https://api.yourdomain.com/api' });

// Simple delay helper to simulate network latency
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to fetch directly from localStorage (in sync with DatabaseContext)
const getStoredData = (key, defaultData) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultData;
};

const saveStoredData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const authService = {
    login: async (email, password) => {
        await delay(300);
        const users = getStoredData('ecomm_users', []);
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar };
            return { data: { token: 'mock-jwt-token-xyz', user: sessionUser } };
        }
        throw { response: { status: 401, data: { message: 'Invalid credentials' } } };
    },

    register: async (name, email, password) => {
        await delay(300);
        const users = getStoredData('ecomm_users', []);
        if (users.some(u => u.email === email)) {
            throw { response: { status: 400, data: { message: 'Email already exists' } } };
        }
        const newUser = {
            id: `user_${Date.now()}`,
            name,
            email,
            password,
            role: 'customer',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
        };
        users.push(newUser);
        saveStoredData('ecomm_users', users);
        const sessionUser = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, avatar: newUser.avatar };
        return { data: { token: 'mock-jwt-token-xyz', user: sessionUser } };
    }
};

export const productService = {
    getAll: async () => {
        await delay(400);
        const products = getStoredData('ecomm_products', []);
        return { data: products };
    },

    getById: async (id) => {
        await delay(200);
        const products = getStoredData('ecomm_products', []);
        const product = products.find(p => p.id === id);
        if (product) {
            return { data: product };
        }
        throw { response: { status: 404, data: { message: 'Product not found' } } };
    },

    create: async (productData) => {
        await delay(400);
        const products = getStoredData('ecomm_products', []);
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
        products.unshift(newProduct);
        saveStoredData('ecomm_products', products);
        return { data: newProduct };
    },

    update: async (id, updatedData) => {
        await delay(400);
        const products = getStoredData('ecomm_products', []);
        let updatedProduct = null;
        const nextProducts = products.map(p => {
            if (p.id === id) {
                updatedProduct = {
                    ...p,
                    ...updatedData,
                    price: parseFloat(updatedData.price),
                    discountPrice: updatedData.discountPrice ? parseFloat(updatedData.discountPrice) : null,
                    stock: parseInt(updatedData.stock, 10)
                };
                return updatedProduct;
            }
            return p;
        });
        if (!updatedProduct) {
            throw { response: { status: 404, data: { message: 'Product not found' } } };
        }
        saveStoredData('ecomm_products', nextProducts);
        return { data: updatedProduct };
    },

    delete: async (id) => {
        await delay(300);
        const products = getStoredData('ecomm_products', []);
        const filtered = products.filter(p => p.id !== id);
        saveStoredData('ecomm_products', filtered);
        return { data: { success: true } };
    }
};

export const categoryService = {
    getAll: async () => {
        await delay(300);
        const categories = getStoredData('ecomm_categories', []);
        return { data: categories };
    },

    create: async (categoryData) => {
        await delay(300);
        const categories = getStoredData('ecomm_categories', []);
        const newCategory = {
            ...categoryData,
            id: `cat_${Date.now()}`,
            slug: categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        };
        categories.push(newCategory);
        saveStoredData('ecomm_categories', categories);
        return { data: newCategory };
    },

    update: async (id, updatedData) => {
        await delay(300);
        const categories = getStoredData('ecomm_categories', []);
        let updatedCategory = null;
        const nextCategories = categories.map(c => {
            if (c.id === id) {
                updatedCategory = {
                    ...c,
                    ...updatedData,
                    slug: (updatedData.name || c.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')
                };
                return updatedCategory;
            }
            return c;
        });
        if (!updatedCategory) {
            throw { response: { status: 404, data: { message: 'Category not found' } } };
        }
        saveStoredData('ecomm_categories', nextCategories);
        return { data: updatedCategory };
    },

    delete: async (id) => {
        await delay(300);
        const categories = getStoredData('ecomm_categories', []);
        const filtered = categories.filter(c => c.id !== id);
        saveStoredData('ecomm_categories', filtered);
        return { data: { success: true } };
    }
};

export const orderService = {
    getAll: async () => {
        await delay(400);
        const orders = getStoredData('ecomm_orders', []);
        return { data: orders };
    },

    create: async (orderData) => {
        await delay(400);
        const orders = getStoredData('ecomm_orders', []);
        const newOrder = {
            ...orderData,
            id: `ord_${Date.now()}`,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };
        orders.unshift(newOrder);
        saveStoredData('ecomm_orders', orders);
        return { data: newOrder };
    },

    updateStatus: async (id, status) => {
        await delay(300);
        const orders = getStoredData('ecomm_orders', []);
        let updatedOrder = null;
        const nextOrders = orders.map(o => {
            if (o.id === id) {
                updatedOrder = { ...o, status };
                return updatedOrder;
            }
            return o;
        });
        if (!updatedOrder) {
            throw { response: { status: 404, data: { message: 'Order not found' } } };
        }
        saveStoredData('ecomm_orders', nextOrders);
        return { data: updatedOrder };
    }
};
