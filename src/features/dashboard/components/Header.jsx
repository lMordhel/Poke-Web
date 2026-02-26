import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { dashboardService as apiService } from '@/features/dashboard/services/dashboardService';
import { dashboardStyles } from '@/features/dashboard/dashboard.styles';

const Header = ({ user, onMenuClick, activeTab, isMobile }) => {
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

const colors = {
  white: '#ffffff',
  black: '#121212',
  grayLight: '#f4f4f5',
  grayMedium: '#e4e4e7',
  grayDark: '#71717a',
  redError: '#EF4444',
  yellowLight: '#FFFBEB',
};

export default Header;
