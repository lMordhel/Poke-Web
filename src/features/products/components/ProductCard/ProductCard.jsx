import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Flame, Zap, Droplets, Leaf, Sparkles, Ghost, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productCardStyles } from './productCard.styles';
import { useAuth } from '@/features/auth';
import { useCart } from '@/features/cart';
import { useActivity } from '@/features/dashboard';

const typeIcons = {
  Electric: Zap,
  Fire: Flame,
  Water: Droplets,
  Grass: Leaf,
  Normal: Sparkles,
  Fairy: Sparkles,
  Ghost: Ghost,
};

const typeColors = {
  Electric: '#FFD700',
  Fire: '#FF6B35',
  Water: '#4A90E2',
  Grass: '#4CAF50',
  Normal: '#A8A878',
  Fairy: '#F0B6BC',
  Ghost: '#705898',
};

const ProductCard = ({ product, showHeart = true }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();
  const TypeIcon = typeIcons[product.type] || Sparkles;
  const typeColor = typeColors[product.type] || '#A8A878';

  const hasVariants = product.variants && product.variants.length > 0;
  const displayPrice = hasVariants
    ? `Desde $${Math.min(...product.variants.map(v => v.price)).toFixed(2)}`
    : `$${product.price}`;

  // Verificar si el producto está en favoritos al cargar
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser && currentUser.loggedIn) {
      const favoritesKey = `favorites_${currentUser.email}`;
      const favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
      const isInFavorites = favorites.some(fav => fav.id === product.id);
      setIsFavorite(isInFavorites);
    }
  }, [product.id]);

  const closeModal = (e) => {
    e.stopPropagation();
    setIsModalOpen(false);
  };

  const { user } = useAuth();
  const { addToCart } = useCart();
  const { logActivity } = useActivity();

  const handleToggleFavorite = (e) => {
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    const favoritesKey = `favorites_${user.email}`;
    const currentFavorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');

    let updatedFavorites;
    if (isFavorite) {
      updatedFavorites = currentFavorites.filter(fav => fav.id !== product.id);
      setIsFavorite(false);
      // Removed event tracking for unfavoriting because it could spam the log
    } else {
      updatedFavorites = [...currentFavorites, product];
      setIsFavorite(true);
      logActivity('favorite', 'Añadido a favoritos', `Agregaste ${product.name} a tu lista`);
    }

    localStorage.setItem(favoritesKey, JSON.stringify(updatedFavorites));

    window.dispatchEvent(new CustomEvent('favoritesUpdated', { detail: updatedFavorites.length }));
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();

    if (hasVariants) {
      const dest = product.slug || product.id;
      if (dest) navigate(`/products/${dest}`);
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    addToCart(product);
    alert(`${product.name} agregado al carrito!`);
  };

  return (
    <>
      <div
        style={{ ...productCardStyles.card, cursor: 'pointer' }}
        onClick={() => {
          const dest = product.slug || product.id;
          if (dest) navigate(`/products/${dest}`);
        }}
      >
        {product.is_new && (
          <div style={productCardStyles.newBadge}>¡Nuevo!</div>
        )}
        {showHeart && (
          <button
            style={productCardStyles.heartButton}
            onClick={handleToggleFavorite}
            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Heart
              size={18}
              strokeWidth={2}
              fill={isFavorite ? '#ff6b6b' : 'none'}
              color={isFavorite ? '#ff6b6b' : '#1a1a1a'}
            />
          </button>
        )}

        <div
          style={{ ...productCardStyles.imageContainer, cursor: 'zoom-in' }}
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
        >
          <div style={productCardStyles.placeholderImage}>
            <img
              src={product.img || product.image_url}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        <div style={{ ...productCardStyles.typeBadge, backgroundColor: typeColor }}>
          <TypeIcon size={12} />
          {product.type}
        </div>

        <h3 style={productCardStyles.productName}>{product.name}</h3>
        <p style={productCardStyles.price}>{displayPrice}</p>

        <button style={productCardStyles.addButton} onClick={handleAddToCart}>
          <ShoppingCart size={16} />
          {hasVariants ? 'Ver opciones' : 'Añadir'}
        </button>
      </div>

      {isModalOpen && (
        <div style={productCardStyles.modalOverlay} onClick={closeModal}>
          <div style={productCardStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={productCardStyles.closeButton} onClick={closeModal}>
              <X size={24} color="#fff" />
            </button>
            <img src={product.img} alt={product.name} style={productCardStyles.fullImage} />
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;