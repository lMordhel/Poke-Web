import { ShoppingCart, LogIn, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import '@/shared/styles/responsive.css';
import { headerStyles } from '@/shared/components/Header/header.styles';
import { useAuth } from '@/features/auth';
import { useCart } from '@/features/cart';

const Header = () => {
  const { user: currentUser } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

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

