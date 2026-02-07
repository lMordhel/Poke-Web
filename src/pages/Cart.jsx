import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/responsive.css';
import Swal from "sweetalert2";
import { cartStyles } from '../styles/cartStyles';
const handleCheckout = () => {
  Swal.fire({
    title: "¡Gracias por tu compra!",
    html: `
      <p style="font-size: 1.1rem;">
        Tu pedido fue capturado con éxito 🎉
      </p>
    `,
    imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
    imageWidth: 120,
    imageHeight: 120,
    background: "#ffcb05",
    color: "#2a75bb",
    confirmButtonText: "¡Genial!",
    confirmButtonColor: "#cc0000",
    customClass: {
      popup: "pokemon-alert"
    }
  });
};
const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si el usuario está logueado
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!currentUser || !currentUser.loggedIn) {
      // Si no está logueado, redirigir al login
      navigate('/login');
      return;
    }

    setUser(currentUser);
    
    // Cargar carrito del localStorage
    const cart = JSON.parse(localStorage.getItem(`cart_${currentUser.email}`) || '[]');
    setCartItems(cart);
  }, [navigate]);

  // Función para actualizar el carrito en localStorage
  const updateCart = (newCart) => {
    if (user) {
      localStorage.setItem(`cart_${user.email}`, JSON.stringify(newCart));
      setCartItems(newCart);
      // Disparar evento para actualizar el contador en el Header
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: newCart.length }));
    }
  };

  // Función para aumentar cantidad
  const increaseQuantity = (productId) => {
    const updatedCart = cartItems.map(item =>
      item.id === productId
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
    updateCart(updatedCart);
  };

  // Función para disminuir cantidad
  const decreaseQuantity = (productId) => {
    const updatedCart = cartItems.map(item =>
      item.id === productId
        ? { ...item, quantity: Math.max(1, item.quantity - 1) }
        : item
    );
    updateCart(updatedCart);
  };

  // Función para eliminar producto
  const removeItem = (productId) => {
    const updatedCart = cartItems.filter(item => item.id !== productId);
    updateCart(updatedCart);
  };

  // Calcular total
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  };

  // Si no hay usuario, no renderizar nada (se está redirigiendo)
  if (!user) {
    return null;
  }

  const styles = cartStyles;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link to="/catalogo" style={styles.backButton}>
          <ArrowLeft size={20} />
          Continuar comprando
        </Link>
        <h1 style={styles.title}>
          <ShoppingCart size={32} />
          Mi Carrito
        </h1>
      </div>

      {cartItems.length === 0 ? (
        <div style={styles.emptyCart}>
          <ShoppingCart size={64} style={styles.emptyIcon} />
          <h2 style={styles.emptyTitle}>Tu carrito está vacío</h2>
          <p style={styles.emptyText}>
            Agrega algunos productos increíbles a tu carrito
          </p>
          <Link to="/catalogo" style={styles.shopButton}>
            Ver Catálogo
          </Link>
        </div>
      ) : (
        <>
          <div style={styles.cartContent}>
            <div style={styles.itemsSection}>
              {cartItems.map((item) => (
                <div key={item.id} style={styles.cartItem}>
                  <div style={styles.itemImage}>
                    <img src={item.img} alt={item.name} style={styles.image} />
                  </div>
                  
                  <div style={styles.itemDetails}>
                    <h3 style={styles.itemName}>{item.name}</h3>
                    <p style={styles.itemType}>{item.type}</p>
                    <p style={styles.itemPrice}>${item.price} c/u</p>
                  </div>

                  <div style={styles.quantityControls}>
                    <button
                      onClick={() => decreaseQuantity(item.id)}
                      style={styles.quantityButton}
                    >
                      <Minus size={16} />
                    </button>
                    <span style={styles.quantity}>{item.quantity}</span>
                    <button
                      onClick={() => increaseQuantity(item.id)}
                      style={styles.quantityButton}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div style={styles.itemTotal}>
                    <p style={styles.totalPrice}>
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    style={styles.removeButton}
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div style={styles.summarySection}>
              <div style={styles.summaryCard}>
                <h2 style={styles.summaryTitle}>Resumen del pedido</h2>
                
                <div style={styles.summaryRow}>
                  <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                
                <div style={styles.summaryRow}>
                  <span>Envío</span>
                  <span style={styles.freeShipping}>Gratis</span>
                </div>
                
                <div style={styles.divider}></div>
                
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>Total</span>
                  <span style={styles.totalAmount}>${calculateTotal().toFixed(2)}</span>
                </div>

                <button
                    style={styles.checkoutButton}
                    onClick={handleCheckout}
                  >
                    <CreditCard size={20} />
                    Proceder al pago
                </button>

                <Link to="/catalogo" style={styles.continueShopping}>
                  Continuar comprando
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
