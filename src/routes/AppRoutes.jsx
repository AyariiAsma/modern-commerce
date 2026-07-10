import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout shells
import CustomerLayout from '../layouts/CustomerLayout';
import AdminLayout from '../layouts/AdminLayout';

// Customer storefront pages
import Home from '../pages/customer/Home';
import Catalog from '../pages/customer/Catalog';
import ProductDetails from '../pages/customer/ProductDetails';
import Cart from '../pages/customer/Cart';
import Checkout from '../pages/customer/Checkout';
import Login from '../pages/customer/Login';
import Register from '../pages/customer/Register';
import Profile from '../pages/customer/Profile';

// Admin dashboard pages
import Dashboard from '../pages/admin/Dashboard';
import Products from '../pages/admin/Products';
import Categories from '../pages/admin/Categories';
import Orders from '../pages/admin/Orders';
import Settings from '../pages/admin/Settings';

export default function AppRoutes() {
    return (
        <Routes>
            {/* Customer Storefront Routes */}
            <Route path="/" element={<CustomerLayout />}>
                <Route index element={<Home />} />
                <Route path="catalog" element={<Catalog />} />
                <Route path="product/:id" element={<ProductDetails />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="profile" element={<Profile />} />
            </Route>

            {/* Admin Dashboard Routes */}
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="categories" element={<Categories />} />
                <Route path="orders" element={<Orders />} />
                <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
