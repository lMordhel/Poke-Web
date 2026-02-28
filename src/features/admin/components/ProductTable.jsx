import React from 'react';
import { adminStyles as styles } from '@/features/admin/admin.styles';

const ProductTable = ({ products, onEdit, onDelete }) => {
    return (
        <div style={styles.tableWrapper}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Imagen</th>
                        <th style={styles.th}>Nombre</th>
                        <th style={styles.th}>Tipo</th>
                        <th style={styles.th}>Precio</th>
                        <th style={styles.th}>Stock</th>
                        <th style={styles.th}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product.id}>
                            <td style={styles.td}>
                                <img
                                    src={product.img || product.image_url}
                                    alt={product.name}
                                    style={{ width: '40px', height: '40px', objectFit: 'contain', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '4px' }}
                                />
                            </td>
                            <td style={{ ...styles.td, fontWeight: '600' }}>{product.name}</td>
                            <td style={styles.td}>
                                <span style={{ ...styles.badge, ...styles.badgeUser }}>{product.type}</span>
                            </td>
                            <td style={{ ...styles.td, fontWeight: '500' }}>
                                ${product.variants && product.variants.length > 0
                                    ? Math.min(...product.variants.map(v => v.price)).toFixed(2)
                                    : product.price || 0}
                            </td>
                            <td style={styles.td}>
                                {product.variants && product.variants.length > 0
                                    ? product.variants.reduce((acc, v) => acc + parseInt(v.stock, 10), 0)
                                    : product.stock || 0}
                            </td>
                            <td style={styles.td}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        style={{ ...styles.buttonPrimary, padding: '6px 12px', fontSize: '12px', backgroundColor: '#e5e7eb', color: '#374151' }}
                                        onClick={() => onEdit(product)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        style={{ ...styles.buttonDanger, padding: '6px 12px', fontSize: '12px' }}
                                        onClick={() => onDelete(product.id)}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductTable;
