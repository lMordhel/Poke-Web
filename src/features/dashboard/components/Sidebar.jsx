import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Settings,
  Package,
  LogOut,
  Home,
  Store,
  X
} from 'lucide-react';
import { dashboardStyles } from '@/features/dashboard/dashboard.styles';
import { dashboardService as apiService } from '@/features/dashboard/services/dashboardService';
import { useActivity } from '@/features/dashboard';
import { clearToken } from '@/lib/axios';

const navItems = [
  { id: 'overview', label: 'Resumen', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'orders', label: 'Mis Pedidos', icon: ShoppingBag, path: '/dashboard' },
  { id: 'favorites', label: 'Favoritos', icon: Heart, path: '/dashboard' },
  { id: 'settings', label: 'Configuración', icon: Settings, path: '/dashboard' },
];

const externalLinks = [
  { label: 'Inicio', icon: Home, path: '/' },
  { label: 'Catálogo', icon: Store, path: '/catalogo' },
];

const Sidebar = ({ activeTab, onTabChange, isOpen, onClose, user, isMobile }) => {
  const location = useLocation();
  const { logActivity } = useActivity();

  const handleLogout = () => {
    logActivity('logout', 'Cierre de sesión', 'Has cerrado tu sesión de forma segura');
    clearToken();
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('userLogout'));
    window.location.href = '/login';
  };

  return (
    <>
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            style={dashboardStyles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        style={{
          ...dashboardStyles.sidebar,
          ...(isMobile ? dashboardStyles.sidebarMobile : {}),
          ...(isMobile && isOpen ? dashboardStyles.sidebarMobileOpen : {})
        }}
      >
        <div style={dashboardStyles.sidebarHeader}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={dashboardStyles.logo}>
              <Package size={22} />
            </div>
            <span style={dashboardStyles.logoText}>WebPoke</span>
          </Link>
          <button
            style={{
              ...dashboardStyles.closeButton,
              display: isMobile ? 'flex' : 'none'
            }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <nav style={dashboardStyles.nav}>
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#71717a',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '8px 16px 12px',
          }}>
            Mi Cuenta
          </span>

          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                style={{
                  ...dashboardStyles.navItem,
                  ...(isActive ? dashboardStyles.navItemActive : {}),
                }}
                onClick={() => {
                  onTabChange(item.id);
                  onClose();
                }}
                whileHover={{ backgroundColor: isActive ? '#FFFBEB' : '#f4f4f5' }}
                whileTap={{ scale: 0.98 }}
              >
                <IconComponent
                  size={18}
                  color={isActive ? '#121212' : '#71717a'}
                />
                <span style={{
                  ...dashboardStyles.navItemText,
                  color: isActive ? '#121212' : '#71717a',
                }}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}

          <div style={{ height: '1px', backgroundColor: '#e4e4e7', margin: '12px 0' }} />

          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#71717a',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '8px 16px 12px',
          }}>
            Navegación
          </span>

          {externalLinks.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                style={{
                  ...dashboardStyles.navItem,
                  textDecoration: 'none',
                  ...(isActive ? dashboardStyles.navItemActive : {}),
                }}
                onClick={onClose}
              >
                <IconComponent
                  size={18}
                  color={isActive ? '#121212' : '#71717a'}
                />
                <span style={{
                  ...dashboardStyles.navItemText,
                  color: isActive ? '#121212' : '#71717a',
                }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div style={dashboardStyles.sidebarFooter}>
          <div style={dashboardStyles.userInfo}>
            <div style={dashboardStyles.userAvatar}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={dashboardStyles.userDetails}>
              <span style={dashboardStyles.userName}>{user?.name || 'Usuario'}</span>
              <span style={dashboardStyles.userRole}>
                {user?.role === 'admin' ? 'Administrador' : 'Cliente'}
              </span>
            </div>
          </div>
          <motion.button
            style={dashboardStyles.logoutButton}
            onClick={handleLogout}
            whileHover={{ backgroundColor: '#EF444410' }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut size={16} />
            Cerrar sesión
          </motion.button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
