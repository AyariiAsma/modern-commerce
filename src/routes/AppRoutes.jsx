import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

// Layout shells
import CustomerLayout from '../layouts/CustomerLayout';
import AdminLayout from '../layouts/AdminLayout';
import WarehouseLayout from '../pages/warehouse/WarehouseLayout';

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
import Banners from '../pages/admin/Banners';
import Stock from '../pages/admin/Stock';
import Promotions from '../pages/admin/Promotions';
import Invoices from '../pages/admin/Invoices';
import Loyalty from '../pages/admin/Loyalty';

// Warehouse pages
import WarehouseDashboard from '../pages/warehouse/Dashboard';
import StockImport from '../pages/warehouse/StockImport';
import OrderPreparation from '../pages/warehouse/OrderPreparation';
import OrderPacker from '../pages/warehouse/OrderPacker';

// Guard: only warehouse or admin can access /warehouse routes
function WarehouseGuard({ children }) {
    const { isAuthenticated, isWarehouse, loading } = useAuth();
    if (loading) return null;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!isWarehouse) return <Navigate to="/" replace />;
    return children;
}

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
                <Route path="banners" element={<Banners />} />
                <Route path="orders" element={<Orders />} />
                <Route path="stock" element={<Stock />} />
                <Route path="promotions" element={<Promotions />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="loyalty" element={<Loyalty />} />
                <Route path="settings" element={<Settings />} />
            </Route>

            {/* Warehouse Interface Routes */}
            <Route
                path="/warehouse"
                element={
                    <WarehouseGuard>
                        <WarehouseLayout>
                            <WarehouseDashboard />
                        </WarehouseLayout>
                    </WarehouseGuard>
                }
            />
            <Route
                path="/warehouse/import"
                element={
                    <WarehouseGuard>
                        <WarehouseLayout>
                            <StockImport />
                        </WarehouseLayout>
                    </WarehouseGuard>
                }
            />
            <Route
                path="/warehouse/orders"
                element={
                    <WarehouseGuard>
                        <WarehouseLayout>
                            <OrderPreparation />
                        </WarehouseLayout>
                    </WarehouseGuard>
                }
            />
            <Route
                path="/warehouse/orders/:orderId"
                element={
                    <WarehouseGuard>
                        <WarehouseLayout>
                            <OrderPacker />
                        </WarehouseLayout>
                    </WarehouseGuard>
                }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
