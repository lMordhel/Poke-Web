import { useEffect, useState } from 'react';
import { Package, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { adminStyles as styles } from '@/features/admin/admin.styles';
import { adminService as apiService } from '@/features/admin/services/adminService';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        products: 0,
        users: 0,
        orders: 0,
        revenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const statsData = await apiService.getAdminStats();

                setStats({
                    products: statsData.products || 0,
                    users: statsData.users || 0,
                    orders: statsData.orders || 0,
                    revenue: statsData.revenue || 0
                });
            } catch (err) {
                console.error('Error loading admin stats', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        { label: 'Total Productos', value: stats.products, icon: Package, color: '#3b82f6' },
        { label: 'Usuarios Registrados', value: stats.users, icon: Users, color: '#10b981' },
        { label: 'Pedidos Totales', value: stats.orders, icon: ShoppingCart, color: '#f59e0b' },
        { label: 'Ingresos Mensuales', value: `$${stats.revenue.toFixed(2)}`, icon: TrendingUp, color: '#8b5cf6' },
    ];

    return (
        <div>
            <div style={styles.header}>
                <h1 style={styles.pageTitle}>Dashboard General</h1>
            </div>

            {loading ? (
                <p>Cargando estadísticas...</p>
            ) : (
                <div style={styles.statsGrid}>
                    {statCards.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} style={styles.card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px 0', fontWeight: '500' }}>
                                            {stat.label}
                                        </p>
                                        <h3 style={{ fontSize: '28px', margin: 0, color: '#111827', fontWeight: '700' }}>
                                            {stat.value}
                                        </h3>
                                    </div>
                                    <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: `${stat.color}15` }}>
                                        <Icon size={24} color={stat.color} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Placeholder for future charts/tables */}
            <div style={{ ...styles.card, padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                <TrendingUp size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <h3>Gráficos de Actividad</h3>
                <p>Aquí se mostrarán los reportes de ventas mensuales próximamente.</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
