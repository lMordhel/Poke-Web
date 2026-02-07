import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShoppingBag, Heart, Settings, LogOut, Package, CreditCard, MapPin } from 'lucide-react';
import '../styles/responsive.css';
import { dashboardStyles } from '../styles/dashboardStyles';
import { colors } from '../styles/theme';
import apiService from '../services/apiService';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get current user data from backend
        const userData = await apiService.getCurrentUser();
        
        // Update user state with backend data
        const currentUserData = {
          id: userData.id,
          name: userData.name || userData.email.split('@')[0],
          email: userData.email,
          loggedIn: true
        };
        
        setUser(currentUserData);
        localStorage.setItem('currentUser', JSON.stringify(currentUserData));
        
        // Cargar favoritos del usuario
        const favoritesKey = `favorites_${userData.email}`;
        const userFavorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
        setFavorites(userFavorites);
        setFavoritesCount(userFavorites.length);
        
      } catch (error) {
        console.error('Failed to load user data:', error);
        // If token is invalid, redirect to login
        apiService.clearToken();
        navigate('/login');
      }
    };

    loadUserData();
  }, [navigate]);

  // Escuchar actualizaciones de favoritos
  useEffect(() => {
    const handleFavoritesUpdate = () => {
      if (user) {
        const favoritesKey = `favorites_${user.email}`;
        const userFavorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
        setFavorites(userFavorites);
        setFavoritesCount(userFavorites.length);
      }
    };

    // Escuchar eventos personalizados
    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    // Escuchar cambios en localStorage (entre pestañas)
    window.addEventListener('storage', handleFavoritesUpdate);
    
    // También verificar periódicamente (por si acaso)
    const interval = setInterval(handleFavoritesUpdate, 1000);

    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
      window.removeEventListener('storage', handleFavoritesUpdate);
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = () => {
    // Clear tokens and user data
    apiService.clearToken();
    
    // Disparar evento personalizado para actualizar el Header
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('userLogout'));
    navigate('/login');
  };

  // Si no hay usuario, no renderizar nada (se está redirigiendo)
  if (!user) {
    return null;
  }

  const stats = [
    { icon: ShoppingBag, label: 'Pedidos', value: '0', color: colors.yellowPrimary },
    { icon: Heart, label: 'Favoritos', value: favoritesCount.toString(), color: '#ff6b6b' },
    { icon: Package, label: 'En camino', value: '0', color: '#4ecdc4' },
    { icon: CreditCard, label: 'Gastado', value: '$0.00', color: '#95e1d3' },
  ];

  const quickActions = [
    { icon: ShoppingBag, label: 'Ver pedidos', link: '/catalogo' },
    { icon: MapPin, label: 'Direcciones', link: '/catalogo' },
    { icon: Settings, label: 'Configuración', link: '/catalogo' },
  ];

  return (
    <div style={styles.container}>
      <section style={styles.welcomeSection}>
        <div style={styles.welcomeContent}>
          <div style={styles.avatar}>
            <User size={32} />
          </div>
          <div>
            <h1 style={styles.welcomeTitle}>
              ¡Bienvenido, <span style={styles.highlight}>{user.name}!</span>
            </h1>
            <p style={styles.welcomeSubtitle}>
              Gestiona tus pedidos, favoritos y configuración desde aquí
            </p>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </section>

      <section style={styles.statsSection}>
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} style={styles.statCard}>
              <div style={{ ...styles.statIcon, backgroundColor: `${stat.color}20` }}>
                <IconComponent size={24} color={stat.color} />
              </div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{stat.value}</div>
                <div style={styles.statLabel}>{stat.label}</div>
              </div>
            </div>
          );
        })}
      </section>

      <section style={styles.actionsSection}>
        <h2 style={styles.sectionTitle}>Acciones rápidas</h2>
        <div style={styles.actionsGrid}>
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <a
                key={index}
                href={action.link}
                style={styles.actionCard}
              >
                <div style={styles.actionIcon}>
                  <IconComponent size={24} />
                </div>
                <span style={styles.actionLabel}>{action.label}</span>
              </a>
            );
          })}
        </div>
      </section>

      <section style={styles.favoritesSection}>
        <h2 style={styles.sectionTitle}>Mis Favoritos</h2>
        {favorites.length === 0 ? (
          <div style={styles.emptyFavorites}>
            <Heart size={48} style={styles.emptyIcon} />
            <p style={styles.emptyText}>No tienes productos favoritos aún</p>
            <a href="/catalogo" style={styles.browseButton}>
              Explorar productos
            </a>
          </div>
        ) : (
          <div style={styles.favoritesGrid}>
            {favorites.map((favorite) => (
              <div key={favorite.id} style={styles.favoriteCard}>
                <div style={styles.favoriteImage}>
                  <img src={favorite.img} alt={favorite.name} style={styles.favoriteImg} />
                </div>
                <div style={styles.favoriteInfo}>
                  <h3 style={styles.favoriteName}>{favorite.name}</h3>
                  <p style={styles.favoriteType}>{favorite.type}</p>
                  <p style={styles.favoritePrice}>${favorite.price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={styles.accountSection}>
        <h2 style={styles.sectionTitle}>Información de cuenta</h2>
        <div style={styles.accountCard}>
          <div style={styles.accountRow}>
            <span style={styles.accountLabel}>Nombre:</span>
            <span style={styles.accountValue}>{user.name}</span>
          </div>
          <div style={styles.accountRow}>
            <span style={styles.accountLabel}>Email:</span>
            <span style={styles.accountValue}>{user.email}</span>
          </div>
          <div style={styles.accountRow}>
            <span style={styles.accountLabel}>Estado:</span>
            <span style={styles.accountStatus}>Activo</span>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles = dashboardStyles;

export default Dashboard;
