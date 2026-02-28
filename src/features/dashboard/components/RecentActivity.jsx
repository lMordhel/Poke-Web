import React from 'react';
import { m as Motion } from 'framer-motion';
import { CheckCircle, Heart, Package, LogIn, ShoppingCart, LogOut, Star, UserPlus, CreditCard } from 'lucide-react';
import { dashboardStyles } from '@/features/dashboard/dashboard.styles';
import { colors } from '@/shared/styles/theme';
import { useActivity } from '@/features/dashboard';

const getRelativeTime = (timestamp) => {
  if (!timestamp) return 'Hace un momento';
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  const diffInSeconds = Math.floor((new Date(timestamp) - new Date()) / 1000);

  if (Math.abs(diffInSeconds) < 60) return 'Hace unos segundos';
  if (Math.abs(diffInSeconds) < 3600) return rtf.format(Math.floor(diffInSeconds / 60), 'minute');
  if (Math.abs(diffInSeconds) < 86400) return rtf.format(Math.floor(diffInSeconds / 3600), 'hour');
  return rtf.format(Math.floor(diffInSeconds / 86400), 'day');
};

const activityConfig = {
  login: { icon: LogIn, color: colors.blueAccent },
  logout: { icon: LogOut, color: colors.grayDark },
  register: { icon: UserPlus, color: colors.bluePrimary },
  add_cart: { icon: ShoppingCart, color: colors.greenSuccess },
  remove_cart: { icon: Package, color: colors.redError },
  clear_cart: { icon: Package, color: colors.yellowDark },
  purchase: { icon: CheckCircle, color: colors.yellowPrimary },
  favorite: { icon: Heart, color: '#f472b6' },
  checkout: { icon: CreditCard, color: colors.yellowDark }
};

const defaultActivityConfig = { icon: Star, color: colors.grayDark };

const RecentActivity = ({ loading = false }) => {
  const { activities } = useActivity();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
    },
  };

  if (loading) {
    return (
      <Motion.div
        key="activity-loading"
        style={dashboardStyles.sectionCard}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div style={dashboardStyles.sectionHeader}>
          <h2 style={dashboardStyles.sectionTitle}>Actividad Reciente</h2>
        </div>
        <div style={dashboardStyles.activityList}>
          {[1, 2, 3, 4].map((i) => (
            <div key={`activity-skel-${i}`} style={dashboardStyles.activityItem}>
              <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.grayLight, opacity: 0.5 }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '70%', height: 14, backgroundColor: colors.grayLight, opacity: 0.5, borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: '50%', height: 12, backgroundColor: colors.grayLight, opacity: 0.5, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </Motion.div>
    );
  }

  return (
    <Motion.div
      key="activity-loaded"
      style={dashboardStyles.sectionCard}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div style={dashboardStyles.sectionHeader}>
        <h2 style={dashboardStyles.sectionTitle}>Actividad Reciente</h2>
      </div>

      <div style={dashboardStyles.activityList}>
        {activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: colors.grayDark, fontSize: '13px' }}>
            No hay actividad reciente aún.
          </div>
        ) : (
          activities.slice(0, 4).map((activityEvent) => {
            const config = activityConfig[activityEvent.type] || defaultActivityConfig;
            const IconComponent = config.icon;

            return (
              <Motion.div
                key={activityEvent.id}
                style={dashboardStyles.activityItem}
                variants={itemVariants}
                whileHover={{
                  backgroundColor: colors.grayLight,
                }}
              >
                <div style={{
                  ...dashboardStyles.activityIcon,
                  backgroundColor: config.color + '15',
                }}>
                  <IconComponent size={16} color={config.color} />
                </div>

                <div style={dashboardStyles.activityContent}>
                  <span style={dashboardStyles.activityTitle}>{activityEvent.title}</span>
                  <span style={dashboardStyles.activityDescription}>{activityEvent.description}</span>
                </div>

                <span style={dashboardStyles.activityTime}>{getRelativeTime(activityEvent.timestamp)}</span>
              </Motion.div>
            );
          })
        )}
      </div>
    </Motion.div>
  );
};

export default RecentActivity;
