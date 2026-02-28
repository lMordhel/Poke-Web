import React, { useState } from 'react';
import { m as Motion } from 'framer-motion';
import {
  User,
  Mail,
  Bell,
  Shield,
  CreditCard,
  MapPin,
  Save,
  Check,
  Heart
} from 'lucide-react';
import { dashboardStyles } from '@/features/dashboard/dashboard.styles';
import { colors } from '@/shared/styles/theme';

const SettingItem = ({ icon, title, description, children }) => {
  const IconComponent = icon;
  return (
    <Motion.div
      style={dashboardStyles.settingItem}
      whileHover={{ backgroundColor: colors.grayLight }}
    >
      <div style={dashboardStyles.settingIcon}>
        <IconComponent size={18} color={colors.grayDark} />
      </div>
      <div style={dashboardStyles.settingContent}>
        <span style={dashboardStyles.settingTitle}>{title}</span>
        {description && <span style={dashboardStyles.settingDescription}>{description}</span>}
      </div>
      <div style={dashboardStyles.settingControl}>
        {children}
      </div>
    </Motion.div>
  );
};

const Toggle = ({ checked, onChange }) => (
  <Motion.button
    style={{
      ...dashboardStyles.toggle,
      backgroundColor: checked ? colors.yellowPrimary : colors.grayMedium,
    }}
    onClick={() => onChange(!checked)}
    whileTap={{ scale: 0.95 }}
  >
    <Motion.div
      style={dashboardStyles.toggleKnob}
      animate={{ x: checked ? 20 : 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  </Motion.button>
);

const SettingsSection = ({ user, loading = false }) => {
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('userNotifications');
    return saved ? JSON.parse(saved) : {
      orders: true,
      promotions: false,
      favorites: true,
    };
  });

  const handleSave = () => {
    localStorage.setItem('userNotifications', JSON.stringify(notifications));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <Motion.div
        style={dashboardStyles.settingsSection}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div style={dashboardStyles.sectionHeader}>
          <h2 style={dashboardStyles.sectionTitle}>Configuración</h2>
        </div>
        <div style={dashboardStyles.settingsGroup}>
          {[1, 2, 3, 4].map((i) => (
            <div key={`setting-skel-${i}`} style={dashboardStyles.settingItem}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.grayLight, opacity: 0.5 }} />
              <div style={dashboardStyles.settingContent}>
                <div style={{ width: 120, height: 14, backgroundColor: colors.grayLight, opacity: 0.5, borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: 180, height: 12, backgroundColor: colors.grayLight, opacity: 0.5, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </Motion.div>
    );
  }

  return (
    <Motion.div
      style={dashboardStyles.settingsSection}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div style={dashboardStyles.sectionHeader}>
        <h2 style={dashboardStyles.sectionTitle}>Configuración</h2>
      </div>

      <div style={dashboardStyles.settingsGroup}>
        <h3 style={dashboardStyles.settingsGroupTitle}>Perfil</h3>
        <SettingItem
          icon={User}
          title="Información Personal"
          description="Nombre, avatar y datos personales"
        >
          <div style={dashboardStyles.profilePreview}>
            <div style={dashboardStyles.profileAvatar}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span style={dashboardStyles.profileName}>{user?.name}</span>
          </div>
        </SettingItem>

        <SettingItem
          icon={Mail}
          title="Email"
          description={user?.email}
        >
          <span style={dashboardStyles.verifiedBadge}>
            <Check size={10} />
            Verificado
          </span>
        </SettingItem>

        <SettingItem
          icon={Shield}
          title="Estado"
          description={user?.isActive !== false ? 'Cuenta activa' : 'Cuenta inactiva'}
        >
          <span style={{
            ...dashboardStyles.verifiedBadge,
            backgroundColor: (user?.isActive !== false ? colors.greenSuccess : colors.redError) + '15',
            color: user?.isActive !== false ? colors.greenSuccess : colors.redError,
          }}>
            <Check size={10} />
            {user?.isActive !== false ? 'Activa' : 'Inactiva'}
          </span>
        </SettingItem>

        <SettingItem
          icon={Shield}
          title="Rol"
          description={user?.role === 'admin' ? 'Administrador' : 'Cliente'}
        >
          <span style={{
            ...dashboardStyles.verifiedBadge,
            backgroundColor: (user?.role === 'admin' ? '#8b5cf6' : colors.blueAccent) + '15',
            color: user?.role === 'admin' ? '#8b5cf6' : colors.blueAccent,
          }}>
            {user?.role === 'admin' ? 'Admin' : 'Cliente'}
          </span>
        </SettingItem>
      </div>

      <div style={dashboardStyles.settingsGroup}>
        <h3 style={dashboardStyles.settingsGroupTitle}>Notificaciones</h3>
        <SettingItem
          icon={Bell}
          title="Notificaciones de Pedidos"
          description="Recibe actualizaciones sobre tus pedidos"
        >
          <Toggle
            checked={notifications.orders}
            onChange={(v) => setNotifications({ ...notifications, orders: v })}
          />
        </SettingItem>

        <SettingItem
          icon={Bell}
          title="Promociones"
          description="Ofertas especiales y descuentos"
        >
          <Toggle
            checked={notifications.promotions}
            onChange={(v) => setNotifications({ ...notifications, promotions: v })}
          />
        </SettingItem>

        <SettingItem
          icon={Heart}
          title="Favoritos"
          description="Alertas de precio en favoritos"
        >
          <Toggle
            checked={notifications.favorites}
            onChange={(v) => setNotifications({ ...notifications, favorites: v })}
          />
        </SettingItem>
      </div>

      <div style={dashboardStyles.settingsGroup}>
        <h3 style={dashboardStyles.settingsGroupTitle}>Privacidad</h3>
        <SettingItem
          icon={Shield}
          title="Seguridad"
          description="Gestiona tu contraseña"
        >
          <Motion.button
            style={dashboardStyles.settingAction}
            whileHover={{ backgroundColor: colors.grayMedium }}
            whileTap={{ scale: 0.98 }}
            onClick={() => alert('Función de seguridad - Próximamente')}
          >
            Gestionar
          </Motion.button>
        </SettingItem>

        <SettingItem
          icon={CreditCard}
          title="Métodos de Pago"
          description="Gestiona tus tarjetas"
        >
          <Motion.button
            style={dashboardStyles.settingAction}
            whileHover={{ backgroundColor: colors.grayMedium }}
            whileTap={{ scale: 0.98 }}
            onClick={() => alert('Métodos de pago - Próximamente')}
          >
            Ver
          </Motion.button>
        </SettingItem>

        <SettingItem
          icon={MapPin}
          title="Direcciones"
          description="Gestiona tus direcciones"
        >
          <Motion.button
            style={dashboardStyles.settingAction}
            whileHover={{ backgroundColor: colors.grayMedium }}
            whileTap={{ scale: 0.98 }}
            onClick={() => alert('Direcciones - Próximamente')}
          >
            Editar
          </Motion.button>
        </SettingItem>
      </div>

      <Motion.button
        style={dashboardStyles.saveButton}
        onClick={handleSave}
        whileHover={{ backgroundColor: colors.yellowDark }}
        whileTap={{ scale: 0.99 }}
      >
        {saved ? (
          <>
            <Check size={16} />
            Guardado
          </>
        ) : (
          <>
            <Save size={16} />
            Guardar Cambios
          </>
        )}
      </Motion.button>
    </Motion.div>
  );
};

export default SettingsSection;
