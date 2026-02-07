import { useState, useEffect } from 'react';
import { ShoppingCart, LogIn, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/responsive.css';
import { headerStyles } from '../styles/headerStyles';

const Header = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Función para actualizar el estado del usuario
    const updateUser = () => {
      const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (user && user.loggedIn) {
        setCurrentUser(user);
        // Cargar contador del carrito
        const cart = JSON.parse(localStorage.getItem(`cart_${user.email}`) || '[]');
        setCartCount(cart.length);
      } else {
        setCurrentUser(null);
        setCartCount(0);
      }
    };

    // Verificar estado inicial
    updateUser();

    // Función para manejar actualización del carrito
    const handleCartUpdate = (e) => {
      if (e.detail !== undefined) {
        setCartCount(e.detail);
      } else {
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (user && user.loggedIn) {
          const cart = JSON.parse(localStorage.getItem(`cart_${user.email}`) || '[]');
          setCartCount(cart.length);
        }
      }
    };

    // Escuchar cambios en localStorage (entre pestañas)
    window.addEventListener('storage', updateUser);
    
    // Escuchar eventos personalizados (misma pestaña)
    window.addEventListener('userLogin', updateUser);
    window.addEventListener('userLogout', updateUser);
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('storage', updateUser);
      window.removeEventListener('userLogin', updateUser);
      window.removeEventListener('userLogout', updateUser);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);



  return (
    <header style={headerStyles.header}>
      <div style={headerStyles.container} className="header-container-responsive">
        <Link to="/" style={headerStyles.logo}>
        <div style={headerStyles.pokeball}>
          <div style={headerStyles.top}></div>
          <div style={headerStyles.middle}>
            <div style={headerStyles.button}></div>
          </div>
          <div style={headerStyles.bottom}></div>
        </div>
          <span>
            Pok<span style={headerStyles.logoAccent} href="/">é</span>
          </span>
        </Link>
        
        <nav style={headerStyles.nav} className="nav-responsive">
          <Link to="/" style={headerStyles.navLink}>Inicio</Link>
          <Link to="/catalogo" style={headerStyles.navLink}>Catálogo</Link>
          {currentUser && (
            <Link to="/dashboard" style={headerStyles.navLink}>Panel</Link>
          )}
        </nav>
        
        <div style={headerStyles.rightActions}>
          {currentUser ? (
            <Link to="/cart" style={headerStyles.cartButton}>
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span style={headerStyles.cartBadge}>{cartCount}</span>
              )}
            </Link>
          ) : (
            <button 
              style={headerStyles.cartButton}
              onClick={() => navigate('/login')}
              title="Inicia sesión para usar el carrito"
            >
              <ShoppingCart size={20} />
            </button>
          )}
          {currentUser ? (
            <Link to="/dashboard" style={headerStyles.userButton}>
              <User size={18} />
              <span>{currentUser.name}</span>
            </Link>
          ) : (
            <Link to="/login" style={headerStyles.loginButton}>
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

