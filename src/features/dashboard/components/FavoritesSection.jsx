import React from 'react';
import { m as Motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { dashboardStyles } from '@/features/dashboard/dashboard.styles';
import { colors } from '@/shared/styles/theme';

const EMPTY_ARRAY = [];

const FavoritesSection = ({ favorites = EMPTY_ARRAY, onRemove, loading = false }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
    },
  };

  if (loading) {
    return (
      <Motion.div
        style={dashboardStyles.favoritesSection}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div style={dashboardStyles.favoritesHeader}>
          <h2 style={dashboardStyles.sectionTitle}>Mis Favoritos</h2>
        </div>
        <div className="favorites-grid" style={dashboardStyles.favoritesGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={`fav-skel-${i}`} style={dashboardStyles.favoriteCard}>
              <div style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 12,
                backgroundColor: colors.grayLight,
                opacity: 0.5,
                marginBottom: 12,
              }} />
              <div style={{ width: '60%', height: 14, backgroundColor: colors.grayLight, opacity: 0.5, borderRadius: 4, marginBottom: 6 }} />
              <div style={{ width: '40%', height: 12, backgroundColor: colors.grayLight, opacity: 0.5, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </Motion.div>
    );
  }

  return (
    <Motion.div
      style={dashboardStyles.favoritesSection}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div style={dashboardStyles.favoritesHeader}>
        <h2 style={dashboardStyles.sectionTitle}>Mis Favoritos</h2>
        <span style={dashboardStyles.favoritesCount}>
          {favorites.length} {favorites.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>

      {favorites.length === 0 ? (
        <Motion.div
          style={dashboardStyles.emptyState}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={dashboardStyles.emptyIcon}>
            <Heart size={32} />
          </div>
          <p style={dashboardStyles.emptyTitle}>No tienes favoritos aún</p>
          <p style={dashboardStyles.emptyText}>Explora el catálogo y guarda tus favoritos</p>
          <Link to="/catalogo" style={dashboardStyles.browseButton}>
            <ShoppingBag size={16} />
            Ver Catálogo
          </Link>
        </Motion.div>
      ) : (
        <Motion.div
          className="favorites-grid"
          style={dashboardStyles.favoritesGrid}
        >
          {favorites.map((product) => (
            <Motion.div
              key={product.id}
              style={dashboardStyles.favoriteCard}
              variants={cardVariants}
              whileHover={{
                y: -4,
                boxShadow: '0 8px 20px -4px rgba(0,0,0,0.12)',
              }}
            >
              <div style={dashboardStyles.favoriteImageWrapper}>
                <img
                  src={product.img}
                  alt={product.name}
                  style={dashboardStyles.favoriteImage}
                />
                <Motion.button
                  style={dashboardStyles.removeButton}
                  onClick={(e) => {
                    e.preventDefault();
                    onRemove(product.id);
                  }}
                  whileHover={{ scale: 1.1, backgroundColor: colors.redError + '20' }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 size={14} />
                </Motion.button>
                {product.isNew && (
                  <span style={dashboardStyles.newBadge}>Nuevo</span>
                )}
              </div>

              <div style={dashboardStyles.favoriteInfo}>
                <h3 style={dashboardStyles.favoriteName}>{product.name}</h3>
                <div style={dashboardStyles.favoriteMeta}>
                  <span style={dashboardStyles.favoriteType}>{product.type}</span>
                  <span style={dashboardStyles.favoritePrice}>${product.price}</span>
                </div>
                <Motion.button
                  style={dashboardStyles.addToCartButton}
                  whileHover={{ backgroundColor: colors.yellowDark }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ShoppingBag size={14} />
                  Añadir
                </Motion.button>
              </div>
            </Motion.div>
          ))}
        </Motion.div>
      )}
    </Motion.div>
  );
};

export default FavoritesSection;
