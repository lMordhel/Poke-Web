import { colors } from '@/shared/styles/theme';

export const dashboardStyles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
    minHeight: 'calc(100vh - 80px)',
  },

  layout: {
    minHeight: '100vh',
    display: 'flex',
    backgroundColor: colors.grayLight,
  },

  sidebar: {
    width: '260px',
    backgroundColor: colors.white,
    borderRight: `1px solid ${colors.grayMedium}`,
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
    transition: 'transform 0.3s ease',
  },

  sidebarMobile: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '280px',
    backgroundColor: colors.white,
    zIndex: 1001,
    transform: 'translateX(-100%)',
    transition: 'transform 0.3s ease',
    boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
  },

  sidebarMobileOpen: {
    transform: 'translateX(0)',
  },

  sidebarHeader: {
    padding: '20px',
    borderBottom: `1px solid ${colors.grayMedium}`,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  logo: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: colors.yellowPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '18px',
    color: colors.black,
  },

  logoText: {
    fontSize: '18px',
    fontWeight: '700',
    color: colors.black,
  },

  nav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
    border: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '500',
    color: colors.grayDark,
  },

  navItemActive: {
    backgroundColor: colors.yellowLight,
    color: colors.black,
  },

  navItemText: {
    fontSize: '14px',
    fontWeight: '500',
  },

  sidebarFooter: {
    padding: '16px',
    borderTop: `1px solid ${colors.grayMedium}`,
  },

  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },

  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: colors.yellowPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '16px',
    color: colors.black,
  },

  userDetails: {
    display: 'flex',
    flexDirection: 'column',
  },

  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.black,
  },

  userRole: {
    fontSize: '12px',
    color: colors.grayDark,
  },

  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '10px 14px',
    backgroundColor: 'transparent',
    border: `1px solid ${colors.grayMedium}`,
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: colors.redError,
    transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  },

  header: {
    height: '64px',
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.grayMedium}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },

  menuButton: {
    display: 'flex',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    color: '#71717a',
    marginRight: '12px',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pageTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: colors.black,
    margin: 0,
  },

  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  searchContainer: {
    position: 'relative',
    width: '240px',
  },

  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.grayDark,
  },

  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 38px',
    backgroundColor: colors.grayLight,
    border: `1px solid ${colors.grayMedium}`,
    borderRadius: '10px',
    fontSize: '14px',
    color: colors.black,
    outline: 'none',
    transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  },

  notificationButton: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: colors.grayLight,
    border: `1px solid ${colors.grayMedium}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: colors.grayDark,
    position: 'relative',
  },

  avatarButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 12px 6px 6px',
    backgroundColor: colors.grayLight,
    border: `1px solid ${colors.grayMedium}`,
    borderRadius: '10px',
    cursor: 'pointer',
  },

  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: colors.yellowPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '14px',
    color: colors.black,
  },

  avatarName: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.black,
  },

  main: {
    flex: 1,
    padding: '24px',
    backgroundColor: colors.grayLight,
    minHeight: 'calc(100vh - 64px)',
  },

  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },

  welcomeSection: {
    marginBottom: '24px',
  },

  welcomeCard: {
    backgroundColor: colors.white,
    borderRadius: '20px',
    padding: '28px 32px',
    boxShadow: colors.shadowSm,
    border: `1px solid ${colors.grayMedium}`,
  },

  welcomeContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '20px',
  },

  welcomeLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },

  welcomeAvatar: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    backgroundColor: colors.yellowPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '22px',
    color: colors.black,
  },

  welcomeTitle: {
    fontSize: '26px',
    fontWeight: '700',
    color: colors.black,
    margin: '0 0 6px 0',
  },

  welcomeHighlight: {
    color: colors.yellowDark,
  },

  welcomeSubtitle: {
    fontSize: '14px',
    color: colors.grayDark,
    margin: 0,
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '24px',
  },

  statCard: {
    backgroundColor: colors.white,
    borderRadius: '16px',
    padding: '20px',
    boxShadow: colors.shadowSm,
    border: `1px solid ${colors.grayMedium}`,
    transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  },

  statCardInner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
  },

  statIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statContent: {
    flex: 1,
  },

  statLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: colors.grayDark,
    marginBottom: '4px',
  },

  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: colors.black,
  },

  grid2Col: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '24px',
    marginBottom: '24px',
  },

  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: '20px',
    padding: '24px',
    boxShadow: colors.shadowSm,
    border: `1px solid ${colors.grayMedium}`,
  },

  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },

  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: colors.black,
    margin: 0,
  },

  viewAllButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.yellowDark,
    cursor: 'pointer',
  },

  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  orderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px',
    backgroundColor: colors.grayLight,
    borderRadius: '12px',
    transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  },

  orderIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: colors.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  orderInfo: {
    flex: 1,
  },

  orderId: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.black,
  },

  orderItems: {
    fontSize: '13px',
    color: colors.grayDark,
  },

  orderStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
  },

  orderTotal: {
    fontSize: '15px',
    fontWeight: '700',
    color: colors.black,
    minWidth: '70px',
    textAlign: 'right',
  },

  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '10px',
    transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  },

  activityIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  activityContent: {
    flex: 1,
  },

  activityTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.black,
  },

  activityDescription: {
    fontSize: '13px',
    color: colors.grayDark,
  },

  activityTime: {
    fontSize: '12px',
    color: colors.grayDark,
    flexShrink: 0,
  },

  favoritesSection: {
    marginBottom: '24px',
  },

  favoritesHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },

  favoritesCount: {
    fontSize: '14px',
    color: colors.grayDark,
    fontWeight: '500',
  },

  favoritesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
  },

  favoriteCard: {
    backgroundColor: colors.white,
    borderRadius: '16px',
    padding: '14px',
    boxShadow: colors.shadowSm,
    border: `1px solid ${colors.grayMedium}`,
    transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  },

  favoriteImageWrapper: {
    position: 'relative',
    marginBottom: '12px',
  },

  favoriteImage: {
    width: '100%',
    aspectRatio: '1',
    objectFit: 'cover',
    borderRadius: '12px',
    backgroundColor: colors.yellowLight,
  },

  removeButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    backgroundColor: colors.white,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: colors.redError,
    boxShadow: colors.shadowSm,
  },

  newBadge: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    padding: '4px 8px',
    backgroundColor: colors.yellowPrimary,
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    color: colors.black,
  },

  favoriteInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  favoriteName: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.black,
    margin: 0,
  },

  favoriteMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  favoriteType: {
    fontSize: '12px',
    color: colors.grayDark,
    padding: '2px 8px',
    backgroundColor: colors.grayLight,
    borderRadius: '6px',
  },

  favoritePrice: {
    fontSize: '16px',
    fontWeight: '700',
    color: colors.black,
  },

  addToCartButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '100%',
    padding: '10px',
    backgroundColor: colors.yellowPrimary,
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    color: colors.black,
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  },

  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 20px',
    backgroundColor: colors.white,
    borderRadius: '20px',
    border: `1px solid ${colors.grayMedium}`,
    textAlign: 'center',
  },

  emptyIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    backgroundColor: colors.grayLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.grayDark,
    marginBottom: '16px',
  },

  emptyTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.black,
    margin: '0 0 8px 0',
  },

  emptyText: {
    fontSize: '14px',
    color: colors.grayDark,
    margin: 0,
  },

  browseButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: colors.yellowPrimary,
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.black,
    cursor: 'pointer',
    marginTop: '16px',
    textDecoration: 'none',
  },

  settingsSection: {
    maxWidth: '800px',
  },

  settingsGroup: {
    backgroundColor: colors.white,
    borderRadius: '16px',
    padding: '8px',
    border: `1px solid ${colors.grayMedium}`,
    marginBottom: '20px',
  },

  settingsGroupTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.grayDark,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '12px 16px 8px',
    margin: 0,
  },

  settingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 12px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  },

  settingIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: colors.grayLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  settingTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.black,
  },

  settingDescription: {
    fontSize: '13px',
    color: colors.grayDark,
  },

  profilePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    backgroundColor: colors.grayLight,
    borderRadius: '8px',
  },

  profileAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    backgroundColor: colors.yellowPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    color: colors.black,
  },

  profileName: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.black,
  },

  verifiedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: colors.greenSuccess + '15',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: colors.greenSuccess,
  },

  toggle: {
    width: '44px',
    height: '26px',
    borderRadius: '13px',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    padding: '3px',
  },

  toggleKnob: {
    width: '20px',
    height: '20px',
    borderRadius: '10px',
    backgroundColor: colors.white,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
  },

  settingAction: {
    padding: '8px 16px',
    backgroundColor: colors.grayLight,
    border: `1px solid ${colors.grayMedium}`,
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: colors.grayDark,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  },

  saveButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    maxWidth: '200px',
    padding: '14px 24px',
    backgroundColor: colors.yellowPrimary,
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '700',
    color: colors.black,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  },

  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    opacity: 1,
    transition: 'opacity 0.3s ease',
  },

  overlayHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },

  closeButton: {
    display: 'none',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    color: colors.grayDark,
  },

  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    minWidth: '240px',
    backgroundColor: colors.white,
    border: `1px solid ${colors.grayMedium}`,
    borderRadius: '14px',
    boxShadow: colors.shadowLg,
    overflow: 'hidden',
    zIndex: 100,
  },

  dropdownHeader: {
    padding: '14px 18px',
    borderBottom: `1px solid ${colors.grayMedium}`,
  },

  dropdownTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.black,
    margin: 0,
  },

  dropdownUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 18px',
  },

  dropdownAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: colors.yellowPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '700',
    color: colors.black,
  },

  dropdownUserName: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.black,
    margin: 0,
  },

  dropdownUserEmail: {
    fontSize: '13px',
    color: colors.grayDark,
    margin: 0,
  },

  dropdownDivider: {
    height: '1px',
    backgroundColor: colors.grayMedium,
    margin: '4px 0',
  },

  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 18px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    color: colors.grayDark,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
    textAlign: 'left',
    textDecoration: 'none',
  },

  dropdownItemText: {
    fontSize: '14px',
    color: colors.grayDark,
  },

  notificationList: {
    maxHeight: '280px',
    overflowY: 'auto',
  },

  notificationItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 18px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
  },

  notificationDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: colors.yellowPrimary,
    marginTop: '5px',
    flexShrink: 0,
  },

  notificationContent: {
    flex: 1,
  },

  notificationText: {
    fontSize: '14px',
    color: colors.black,
    margin: '0 0 4px 0',
  },

  notificationTime: {
    fontSize: '12px',
    color: colors.grayDark,
  },

  skeleton: {
    backgroundColor: colors.grayMedium,
    animation: 'pulse 1.5s ease-in-out infinite',
    borderRadius: '8px',
  },
};
