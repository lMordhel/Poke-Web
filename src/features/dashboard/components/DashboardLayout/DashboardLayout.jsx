import React, { useState, useEffect } from 'react';
import { m as Motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Header from '../Header';
import StatsCards from '../StatsCards';
import OrdersSection from '../OrdersSection';
import RecentActivity from '../RecentActivity';
import FavoritesSection from '../FavoritesSection';
import SettingsSection from '../SettingsSection';
import { dashboardStyles } from '@/features/dashboard/dashboard.styles';
import { authService } from '@/features/auth/services/authService';
import { cartService } from '@/features/cart/services/cartService';
import { clearToken } from '@/lib/axios';
import { useNavigate } from 'react-router-dom';
import { colors } from '@/shared/styles/theme';

const DashboardContent = ({ activeTab, user, favorites, orders, loading, handleRemoveFavorite }) => {
  switch (activeTab) {
    case 'overview':
      return (
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={dashboardStyles.welcomeSection}>
            <div style={dashboardStyles.welcomeCard}>
              <div style={dashboardStyles.welcomeContent}>
                <div style={dashboardStyles.welcomeLeft}>
                  <div style={dashboardStyles.welcomeAvatar}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h1 style={dashboardStyles.welcomeTitle}>
                      Bienvenido,{' '}
                      <span style={dashboardStyles.welcomeHighlight}>{user?.name?.split(' ')[0]}</span>
                    </h1>
                    <p style={dashboardStyles.welcomeSubtitle}>
                      Aquí está un resumen de tu actividad reciente
                    </p>
                  </div>
                </div>
                <Link
                  to="/catalogo"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: colors.yellowPrimary,
                    borderRadius: '12px',
                    fontWeight: '600',
                    color: colors.black,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  Ver Catálogo
                </Link>
              </div>
            </div>
          </div>

          <StatsCards
            favoritesCount={favorites.length}
            orders={orders}
            loading={loading}
          />

          <div className="grid-2col" style={dashboardStyles.grid2Col}>
            <OrdersSection orders={orders} loading={loading} />
            <RecentActivity loading={loading} />
          </div>
        </Motion.div>
      );

    case 'orders':
      return (
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <StatsCards
            favoritesCount={favorites.length}
            orders={orders}
            loading={loading}
          />
          <OrdersSection orders={orders} loading={loading} />
        </Motion.div>
      );

    case 'favorites':
      return (
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <FavoritesSection
            favorites={favorites}
            onRemove={handleRemoveFavorite}
            loading={loading}
          />
        </Motion.div>
      );

    case 'settings':
      return (
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <SettingsSection
            user={user}
            loading={loading}
          />
        </Motion.div>
      );

    default:
      return null;
  }
};


const DashboardLayout = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await authService.getCurrentUser();

        const currentUserData = {
          id: userData.id,
          name: userData.name || userData.email.split('@')[0],
          email: userData.email,
          role: userData.role,
          isActive: userData.is_active ?? true,
          createdAt: userData.created_at,
          loggedIn: true,
        };

        setUser(currentUserData);
        localStorage.setItem('currentUser', JSON.stringify(currentUserData));

        const favoritesKey = `favorites_${userData.email}`;
        const userFavorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
        setFavorites(userFavorites);

        const userOrders = await cartService.getOrders();
        setOrders(userOrders);

        setLoading(false);
      } catch (error) {
        console.error('Failed to load user data:', error);
        clearToken();
        navigate('/login');
      }
    };

    loadUserData();
  }, [navigate]);

  useEffect(() => {
    const handleFavoritesUpdate = () => {
      if (user) {
        const favoritesKey = `favorites_${user.email}`;
        const userFavorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
        setFavorites(userFavorites);
      }
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    window.addEventListener('storage', handleFavoritesUpdate);

    // Refresh orders natively when there's an activity event (like purchase)
    const handleActivityUpdated = async (e) => {
      const newActivity = e.detail;
      if (newActivity && newActivity.type === 'purchase') {
        try {
          const freshOrders = await cartService.getOrders();
          setOrders(freshOrders);
        } catch (error) {
          console.error("Failed to re-sync orders after purchase:", error);
        }
      }
    };
    window.addEventListener('activityUpdated', handleActivityUpdated);

    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
      window.removeEventListener('storage', handleFavoritesUpdate);
      window.removeEventListener('activityUpdated', handleActivityUpdated);
    };
  }, [user]);

  const handleRemoveFavorite = (productId) => {
    if (!user) return;

    const favoritesKey = `favorites_${user.email}`;
    const currentFavorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
    const updatedFavorites = currentFavorites.filter(f => f.id !== productId);
    localStorage.setItem(favoritesKey, JSON.stringify(updatedFavorites));
    setFavorites(updatedFavorites);
    window.dispatchEvent(new CustomEvent('favoritesUpdated'));
  };



  return (
    <div style={dashboardStyles.layout}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        isMobile={isMobile}
      />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginLeft: isMobile ? '0' : '260px',
        transition: 'margin-left 0.3s ease',
        width: isMobile ? '100%' : 'calc(100% - 260px)',
      }}>
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          activeTab={activeTab}
          isMobile={isMobile}
        />

        <main style={{
          ...dashboardStyles.main,
          padding: isMobile ? '16px' : '24px',
        }}>
          <div style={dashboardStyles.content}>
            <DashboardContent
              activeTab={activeTab}
              user={user}
              favorites={favorites}
              orders={orders}
              loading={loading}
              handleRemoveFavorite={handleRemoveFavorite}
            />
          </div>
        </main>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          background-color: #f4f4f5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }

        @media (max-width: 1200px) {
          .grid-2col {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          .favorites-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          
          .favorites-grid {
            grid-template-columns: 1fr !important;
          }
          
          .search-container {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
