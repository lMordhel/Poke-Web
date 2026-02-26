import { useEffect, useState } from 'react';
import { adminStyles as styles } from '@/features/admin/admin.styles';
import { adminService as apiService } from '@/features/admin/services/adminService';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await apiService.getUsers();
                setUsers(data);
            } catch (err) {
                console.error('Error fetching users', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    return (
        <div>
            <div style={styles.header}>
                <h1 style={styles.pageTitle}>Gestión de Usuarios</h1>
            </div>

            <div style={styles.card}>
                {loading ? (
                    <p>Cargando usuarios...</p>
                ) : (
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>Nombre</th>
                                    <th style={styles.th}>Email</th>
                                    <th style={styles.th}>Rol</th>
                                    <th style={styles.th}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td style={{ ...styles.td, color: '#6b7280', fontSize: '13px' }}>{user.id}</td>
                                        <td style={{ ...styles.td, fontWeight: '500' }}>{user.name || 'Sin nombre'}</td>
                                        <td style={styles.td}>{user.email}</td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.badge,
                                                ...(user.role === 'admin' ? styles.badgeAdmin : styles.badgeUser)
                                            }}>
                                                {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <button style={{ ...styles.buttonDanger, padding: '6px 12px', fontSize: '12px' }}>
                                                Bloquear
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
