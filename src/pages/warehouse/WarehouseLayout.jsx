import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { Package, ArrowDownToLine, Truck, BarChart2, LogOut, LayoutDashboard } from 'lucide-react';

const navItems = [
    { to: '/warehouse', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/warehouse/import', icon: ArrowDownToLine, label: 'Stock Import' },
    { to: '/warehouse/orders', icon: Truck, label: 'Order Packing' },
];

export default function WarehouseLayout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (item) => {
        if (item.exact) return location.pathname === item.to;
        return location.pathname.startsWith(item.to);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Bar */}
            <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 rounded-xl p-1.5">
                        <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 text-sm leading-none">Warehouse</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">{user?.name}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-red-500 text-xs font-semibold transition"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </header>

            {/* Main content */}
            <main className="flex-1 p-4 pb-24 max-w-2xl mx-auto w-full">
                {children}
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
                <div className="flex max-w-2xl mx-auto">
                    {navItems.map((item) => {
                        const active = isActive(item);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`flex-1 flex flex-col items-center py-3 gap-1 text-[10px] font-bold transition ${
                                    active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                <Icon className={`h-5 w-5 ${active ? 'text-indigo-600' : ''}`} />
                                {item.label}
                                {active && <span className="w-1 h-1 rounded-full bg-indigo-600" />}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
