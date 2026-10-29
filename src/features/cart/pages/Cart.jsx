import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import '@/shared/styles/responsive.css';
import Swal from "sweetalert2";
import { cartStyles } from '@/features/cart/cart.styles';
import { useAuth } from '@/features/auth';
import { useCart } from '@/features/cart';
import { useActivity } from '@/features/dashboard';
import { cartService as apiService } from '@/features/cart/services/cartService';

const Cart = () => {
  const { user } = useAuth();
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const { logActivity } = useActivity();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setIsProcessing(true);
    try {
      // 1. Await creating order via Real API 
      // El servidor decide el precio: aquí solo viaja QUÉ se compra y CUÁNTO.
      // `total` se envía únicamente para detectar un carrito con precios viejos.
      const orderData = {
        total: cartTotal,
        items: cartItems.map(item => ({
          id: item.id.toString(),
          quantity: item.quantity,
          size: item.size || null
        }))
      };
      const order = await apiService.createOrder(orderData);

      // 2. Await activity logic
      await logActivity('purchase', 'Compra completada', `Pedido por un total de $${Number(order.total).toFixed(2)} procesado exitosamente`);

      clearCart();

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
      }).then(() => {
        navigate('/dashboard');
      });
    } catch (error) {
      console.error('Error during checkout:', error);

      // 409 = el catálogo cambió desde que se armó el carrito (precio o stock).
      if (error.status === 409) {
        Swal.fire({
          icon: 'warning',
          title: 'Tu carrito cambió',
          text: 'Algún producto cambió de precio o se quedó sin stock. Revisa el carrito y vuelve a intentarlo.',
        });
        return;
      }

      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Hubo un error al procesar tu pedido. Intenta nuevamente.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

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
                <div key={item.cartItemId || item.id} style={styles.cartItem}>
                  <div style={styles.itemImage}>
                    <img src={item.img} alt={item.name} style={styles.image} />
                  </div>

                  <div style={styles.itemDetails}>
                    <h3 style={styles.itemName}>{item.name}</h3>
                    <p style={styles.itemType}>{item.type}</p>
                    {item.size && (
                      <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px', fontWeight: '500' }}>
                        Talla: {item.size}
                      </p>
                    )}
                    <p style={styles.itemPrice}>${item.price} c/u</p>
                  </div>

                  <div style={styles.quantityControls}>
                    <button
                      onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity - 1)}
                      style={styles.quantityButton}
                    >
                      <Minus size={16} />
                    </button>
                    <span style={styles.quantity}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity + 1)}
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
                    onClick={() => removeFromCart(item.cartItemId || item.id)}
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
                  <span>${cartTotal.toFixed(2)}</span>
                </div>

                <div style={styles.summaryRow}>
                  <span>Envío</span>
                  <span style={styles.freeShipping}>Gratis</span>
                </div>

                <div style={styles.divider}></div>

                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>Total</span>
                  <span style={styles.totalAmount}>${cartTotal.toFixed(2)}</span>
                </div>

                <button
                  style={{ ...styles.checkoutButton, opacity: isProcessing ? 0.7 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                  onClick={handleCheckout}
                  disabled={isProcessing || cartItems.length === 0}
                >
                  {isProcessing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '20px', height: '20px', border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      Procesando...
                    </div>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Proceder al pago
                    </>
                  )}
                </button>

                <Link to="/catalogo" style={styles.continueShopping}>
                  Continuar comprando
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
      <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
};

export default Cart;
