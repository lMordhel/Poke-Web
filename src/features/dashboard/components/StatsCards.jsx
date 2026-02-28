import React, { useEffect } from 'react';
import { m as Motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ShoppingBag, Heart, Truck, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { dashboardStyles } from '@/features/dashboard/dashboard.styles';
import { colors } from '@/shared/styles/theme';

const AnimatedNumber = ({ value, prefix = '', suffix = '' }) => {
  const motionValue = useMotionValue(0);
  const displayValue = useTransform(motionValue, (latest) =>
    prefix + Math.round(latest).toLocaleString() + suffix
  );

  useEffect(() => {
    const numValue = typeof value === 'string'
      ? parseFloat(value.replace(/[^0-9.-]+/g, ''))
      : value;

    if (!isNaN(numValue)) {
      const controls = animate(motionValue, numValue, {
        duration: 1.5,
        ease: [0.16, 1, 0.3, 1],
      });
      return controls.stop;
    }
  }, [value, motionValue]);

  return <Motion.span>{displayValue}</Motion.span>;
};

const StatCard = ({ icon, label, value, change, changeType, color, delay = 0 }) => {
  const IconComponent = icon;
  const isPositive = changeType === 'positive';

  return (
    <Motion.div
      style={dashboardStyles.statCard}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, boxShadow: '0 8px 20px -4px rgba(0,0,0,0.12)' }}
    >
      <div style={dashboardStyles.statCardInner}>
        <div style={{ ...dashboardStyles.statIcon, backgroundColor: color + '15' }}>
          <IconComponent size={20} color={color} />
        </div>

        <div style={dashboardStyles.statContent}>
          <div style={dashboardStyles.statLabel}>{label}</div>
          <div style={dashboardStyles.statValue}>
            <AnimatedNumber value={value} />
          </div>
        </div>
      </div>

      {change && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '8px',
          fontSize: '12px',
          fontWeight: '600',
          color: isPositive ? colors.greenSuccess : colors.redError,
        }}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{change}</span>
        </div>
      )}
    </Motion.div>
  );
};

const EMPTY_ARRAY = [];

const StatsCards = ({ favoritesCount, orders = EMPTY_ARRAY, loading }) => {
  const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const inTransit = orders.filter(o => o.status === 'shipped' || o.status === 'processing').length;

  const stats = [
    {
      icon: ShoppingBag,
      label: 'Total Pedidos',
      value: orders.length.toString() || '0',
      change: '+12%',
      changeType: 'positive',
      color: colors.yellowPrimary,
      delay: 0
    },
    {
      icon: Heart,
      label: 'Favoritos',
      value: favoritesCount.toString() || '0',
      color: '#f472b6',
      delay: 0.1
    },
    {
      icon: Truck,
      label: 'En Camino',
      value: inTransit.toString() || '0',
      color: colors.blueAccent,
      delay: 0.2
    },
    {
      icon: CreditCard,
      label: 'Total Gastado',
      value: `$${totalSpent.toFixed(2)}`,
      change: '+8%',
      changeType: 'positive',
      color: colors.greenSuccess,
      delay: 0.3
    },
  ];

  if (loading) {
    return (
      <div className="stats-grid" style={dashboardStyles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={`stat-skel-${i}`} style={dashboardStyles.statCard}>
            <div style={dashboardStyles.statCardInner}>
              <div style={{ ...dashboardStyles.statIcon, opacity: 0.3 }}>
                <ShoppingBag size={20} color={colors.yellowPrimary} />
              </div>
              <div style={dashboardStyles.statContent}>
                <div style={{ ...dashboardStyles.statLabel, opacity: 0.3, width: 80 }}>Cargando...</div>
                <div style={{ ...dashboardStyles.statValue, opacity: 0.3, width: 60 }}>-</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stats-grid" style={dashboardStyles.statsGrid}>
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
};

export default StatsCards;
