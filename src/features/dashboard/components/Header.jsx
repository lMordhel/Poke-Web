import React from 'react';
import { Menu } from 'lucide-react';
import { dashboardStyles } from '@/features/dashboard/dashboard.styles';

const Header = ({ onMenuClick, activeTab, isMobile }) => {
  const tabLabels = {
    overview: 'Resumen',
    orders: 'Mis Pedidos',
    favorites: 'Favoritos',
    settings: 'Configuración',
  };

  return (
    <header className="header header-layout" style={{ ...dashboardStyles.header, justifyContent: 'flex-start' }}>
      <div style={dashboardStyles.headerLeft}>
        <button
          className="menu-btn"
          style={{
            ...dashboardStyles.menuButton,
            display: isMobile ? 'flex' : 'none'
          }}
          onClick={onMenuClick}
        >
          <Menu size={24} />
        </button>
        <h1 style={dashboardStyles.pageTitle}>{tabLabels[activeTab] || 'Dashboard'}</h1>
      </div>


    </header>
  );
};

export default Header;
