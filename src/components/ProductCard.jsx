import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Flame, Zap, Droplets, Leaf, Sparkles, Ghost, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productCardStyles } from '../styles/productCardStyles';

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

  const handleToggleFavorite = (e) => {
    e.stopPropagation();

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

    if (!currentUser || !currentUser.loggedIn) {
      navigate('/login');
      return;
    }

    const favoritesKey = `favorites_${currentUser.email}`;
    const currentFavorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');

    let updatedFavorites;
    if (isFavorite) {
      updatedFavorites = currentFavorites.filter(fav => fav.id !== product.id);
      setIsFavorite(false);
    } else {
      updatedFavorites = [...currentFavorites, product];
      setIsFavorite(true);
    }

    localStorage.setItem(favoritesKey, JSON.stringify(updatedFavorites));

    window.dispatchEvent(new CustomEvent('favoritesUpdated', { detail: updatedFavorites.length }));
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

    if (!currentUser || !currentUser.loggedIn) {
      navigate('/login');
      return;
    }

    const cartKey = `cart_${currentUser.email}`;
    const currentCart = JSON.parse(localStorage.getItem(cartKey) || '[]');

    const existingItem = currentCart.find(item => item.id === product.id);

    let updatedCart;
    if (existingItem) {
      updatedCart = currentCart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [...currentCart, { ...product, quantity: 1 }];
    }

    localStorage.setItem(cartKey, JSON.stringify(updatedCart));

    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: updatedCart.length }));

    alert(`${product.name} agregado al carrito!`);
  };

  return (
    <>
      <div style={productCardStyles.card}>
        {product.isNew && (
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
          onClick={() => setIsModalOpen(true)}
        >
          <div style={productCardStyles.placeholderImage}>
            <img
              src={product.img}
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
        <p style={productCardStyles.price}>${product.price}</p>

        <button style={productCardStyles.addButton} onClick={handleAddToCart}>
          <ShoppingCart size={16} />
          Añadir
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