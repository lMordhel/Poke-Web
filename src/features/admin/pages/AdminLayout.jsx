import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Package, LogOut, ShieldAlert } from 'lucide-react';
import { adminStyles as styles } from '@/features/admin/admin.styles';
import { adminService as apiService } from '@/features/admin/services/adminService';
import { clearToken } from '@/lib/axios';

const AdminLayout = ({ children }) => {
    const location = useLocation();

    const menuItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/products', label: 'Productos', icon: Package },
        { path: '/admin/users', label: 'Usuarios', icon: Users }
    ];

    const handleLogout = () => {
        clearToken();
        window.location.href = '/login';
    };

    return (
        <div style={styles.layout}>
            {/* Sidebar */}
            <aside style={styles.sidebar}>
                <div style={styles.sidebarHeader}>
                    <h2 style={styles.sidebarBrand}>
                        <ShieldAlert size={24} color="#b48600" /> WebPoke Admin
                    </h2>
                </div>

                <nav style={styles.navContainer}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        const itemStyle = isActive
                            ? { ...styles.navItem, ...styles.navItemActive }
                            : styles.navItem;

                        return (
                            <Link key={item.path} to={item.path} style={itemStyle}>
                                <Icon size={20} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: '24px', marginTop: 'auto', borderTop: '1px solid #e5e7eb' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            ...styles.navItem,
                            width: '100%',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444'
                        }}
                    >
                        <LogOut size={20} /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={styles.mainContent}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
