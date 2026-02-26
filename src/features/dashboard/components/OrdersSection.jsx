import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Eye,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardStyles } from '@/features/dashboard/dashboard.styles';
import { colors } from '@/shared/styles/theme';

const statusConfig = {
  pending: { label: 'Pendiente', color: colors.yellowDark, icon: Clock },
  processing: { label: 'Procesando', color: colors.blueAccent, icon: Truck },
  shipped: { label: 'En Camino', color: '#8b5cf6', icon: Truck },
  delivered: { label: 'Entregado', color: colors.greenSuccess, icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: colors.redDanger || '#ef4444', icon: XCircle },
};

const formatDate = (dateString) => {
  if (!dateString) return 'Fecha desconocida';
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-ES', options);
};

const OrdersSection = ({ orders = [], loading = false }) => {
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleOrder = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
    },
  };

  if (loading) {
    return (
      <motion.div
        key="orders-loading"
        style={dashboardStyles.sectionCard}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div style={dashboardStyles.sectionHeader}>
          <h2 style={dashboardStyles.sectionTitle}>Mis Pedidos</h2>
        </div>
        <div style={dashboardStyles.ordersList}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={dashboardStyles.orderRow}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.grayLight, opacity: 0.5 }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: 100, height: 14, backgroundColor: colors.grayLight, opacity: 0.5, borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: 60, height: 12, backgroundColor: colors.grayLight, opacity: 0.5, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="orders-loaded"
      style={dashboardStyles.sectionCard}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div style={dashboardStyles.sectionHeader}>
        <h2 style={dashboardStyles.sectionTitle}>Mis Pedidos</h2>
        <Link to="/catalogo" style={dashboardStyles.viewAllButton}>
          Ver todos <ChevronRight size={16} />
        </Link>
      </div>

      <div style={dashboardStyles.ordersList}>
        {orders.length === 0 ? (
          <motion.div
            style={dashboardStyles.emptyState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={dashboardStyles.emptyIcon}>
              <Package size={32} />
            </div>
            <p style={dashboardStyles.emptyTitle}>No tienes pedidos aún</p>
            <p style={dashboardStyles.emptyText}>Explora nuestro catálogo para hacer tu primer pedido</p>
            <Link to="/catalogo" style={dashboardStyles.browseButton}>
              Ver Catálogo
            </Link>
          </motion.div>
        ) : (
          orders.slice(0, 3).map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            const isExpanded = !!expandedOrders[order.id];

            // Extraer últimos 5 caracteres del order.id para que se vea limpio (ej: #a5473)
            const shortId = order.id ? order.id.slice(-5).toUpperCase() : 'UNKNOWN';

            return (
              <motion.div
                key={order.id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  marginBottom: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
                variants={rowVariants}
              >
                {/* Cabecera del Accordion (Clickable) */}
                <div
                  onClick={() => toggleOrder(order.id)}
                  style={{ ...dashboardStyles.orderRow, marginBottom: 0, border: 'none', cursor: 'pointer', transition: 'background-color 0.2s', backgroundColor: isExpanded ? '#f8fafc' : '#fff' }}
                >
                  <div style={dashboardStyles.orderIcon}>
                    <Package size={20} color={colors.grayDark} />
                  </div>

                  <div style={{ ...dashboardStyles.orderInfo, flex: 2 }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                      Pedido #{shortId}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {formatDate(order.created_at)}
                    </span>
                  </div>

                  <div style={{ flex: 1.5, display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                      ...dashboardStyles.orderStatus,
                      backgroundColor: status.color + '15',
                      color: status.color,
                      padding: '6px 12px',
                      borderRadius: '99px',
                      fontWeight: '600'
                    }}>
                      <StatusIcon size={14} />
                      <span>{status.label}</span>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                      ${order.total?.toFixed(2) || '0.00'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      {order.items?.length || 0} items
                    </span>
                  </div>

                  <div style={{ marginLeft: '16px', color: '#9ca3af' }}>
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                </div>

                {/* Contenido Expandible Animado */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ borderTop: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}
                    >
                      <div style={{ padding: '24px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Productos Comprados
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {order.items?.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#fff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>

                              <div style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: '#f3f4f6', padding: '4px', flexShrink: 0 }}>
                                <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              </div>

                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                                  {item.name}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#6b7280' }}>
                                  {item.size && (
                                    <span style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', fontWeight: '500' }}>
                                      Talla: {item.size}
                                    </span>
                                  )}
                                  <span>Cant: {item.quantity}</span>
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                                  ${item.price?.toFixed(2)} c/u
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                                  Subtotal: ${(item.price * item.quantity).toFixed(2)}
                                </div>
                              </div>

                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default OrdersSection;
