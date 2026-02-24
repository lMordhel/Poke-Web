import { colors } from './theme';

export const adminStyles = {
    layout: {
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#f5f7fb',
        fontFamily: "'Inter', sans-serif"
    },
    sidebar: {
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
    },
    sidebarHeader: {
        padding: '0 24px 24px 24px',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '24px'
    },
    sidebarBrand: {
        fontSize: '20px',
        fontWeight: '700',
        color: colors.textPrimary,
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    navContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '0 16px',
        flex: 1
    },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '8px',
        textDecoration: 'none',
        color: colors.textSecondary,
        fontWeight: '500',
        transition: 'all 0.2s',
    },
    navItemActive: {
        backgroundColor: `${colors.yellowPrimary}30`,
        color: '#b48600',
        fontWeight: '600',
    },
    mainContent: {
        flex: 1,
        padding: '32px 48px',
        overflowY: 'auto'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
    },
    pageTitle: {
        fontSize: '28px',
        fontWeight: '700',
        color: colors.textPrimary,
        margin: 0
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
    },
    tableWrapper: {
        width: '100%',
        overflowX: 'auto',
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left'
    },
    th: {
        padding: '16px 24px',
        borderBottom: '2px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },
    td: {
        padding: '16px 24px',
        borderBottom: '1px solid #e5e7eb',
        color: colors.textPrimary,
        fontSize: '14px',
        verticalAlign: 'middle'
    },
    buttonPrimary: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        backgroundColor: colors.yellowPrimary,
        color: '#000',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s, transform 0.1s'
    },
    buttonDanger: {
        backgroundColor: '#fee2e2',
        color: '#ef4444',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    },
    badge: {
        padding: '4px 12px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'inline-block'
    },
    badgeAdmin: {
        backgroundColor: '#dbeafe',
        color: '#1e3a8a'
    },
    badgeUser: {
        backgroundColor: '#f3f4f6',
        color: '#4b5563'
    },

    // --- NUEVOS ESTILOS PARA EL MODAL (Rediseño) ---
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '24px',
        animation: 'fadeIn 0.2s ease-out'
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        transform: 'translateY(0)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '16px',
        marginBottom: '8px'
    },
    modalTitle: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#0f172a',
        margin: 0,
        letterSpacing: '-0.02em'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    label: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },
    input: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #cbd5e1',
        backgroundColor: '#f8fafc',
        fontSize: '15px',
        color: '#1e293b',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
        outline: 'none',
        ':focus': {
            borderColor: '#3b82f6',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
        }
    },
    fileInputWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        backgroundColor: '#f1f5f9',
        border: '1px dashed #94a3b8',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '32px',
        paddingTop: '24px',
        borderTop: '1px solid #f1f5f9'
    }
};
