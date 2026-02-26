import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import ProtectedRoute from '@/shared/components/ProtectedRoute';
import AdminRoute from '@/shared/components/AdminRoute';

const Home = lazy(() => import('@/features/home/pages/Home'));
const Login = lazy(() => import('@/features/auth/pages/Login'));
const Register = lazy(() => import('@/features/auth/pages/Register'));
const Catalog = lazy(() => import('@/features/products/pages/Catalog'));
const ProductDetail = lazy(() => import('@/features/products/pages/ProductDetail'));
const Cart = lazy(() => import('@/features/cart/pages/Cart'));

// Dashboard (Protected)
const Dashboard = lazy(() => import('@/features/dashboard/pages/Dashboard'));
const RecentActivity = lazy(() => import('@/features/dashboard/components/RecentActivity'));
const FavoritesSection = lazy(() => import('@/features/dashboard/components/FavoritesSection'));
const OrdersSection = lazy(() => import('@/features/dashboard/components/OrdersSection'));
const SettingsSection = lazy(() => import('@/features/dashboard/components/SettingsSection'));

// Admin (Admin only)
const AdminLayout = lazy(() => import('@/features/admin/pages/AdminLayout'));
const AdminDashboard = lazy(() => import('@/features/admin/pages/AdminDashboard'));
const AdminProducts = lazy(() => import('@/features/admin/pages/AdminProducts'));
const AdminUsers = lazy(() => import('@/features/admin/pages/AdminUsers'));

export const AppRoutes = () => {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#e0dfdc' }}>
                <div className="pokeball-spinner"></div>
            </div>
        }>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/catalogo" element={<Catalog />} />
                <Route path="/products/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />

                {/* Protected Dashboard Routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }>
                    <Route index element={<RecentActivity />} />
                    <Route path="activity" element={<RecentActivity />} />
                    <Route path="favorites" element={<FavoritesSection />} />
                    <Route path="orders" element={<OrdersSection />} />
                    <Route path="settings" element={<SettingsSection />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={
                    <AdminRoute>
                        <AdminLayout />
                    </AdminRoute>
                }>
                    <Route index element={<AdminDashboard />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="users" element={<AdminUsers />} />
                </Route>
            </Routes>
        </Suspense>
    );
};
