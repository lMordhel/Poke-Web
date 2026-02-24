import { useEffect, useState } from 'react';
import { adminStyles as styles } from '../../styles/adminStyles';
import apiService from '../../services/apiService';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal and Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        price: '',
        stock: '',
        description: '',
        image_url: ''
    });

    const [actionLoading, setActionLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await apiService.getProducts({ page: 1, limit: 100 });
                const transformed = apiService.transformProductList(data.products || []);
                setProducts(transformed);
            } catch (err) {
                console.error('Error fetching products', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await apiService.getProducts({ page: 1, limit: 100 });
            const transformed = apiService.transformProductList(data.products || []);
            setProducts(transformed);
        } catch (err) {
            console.error('Error fetching products', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name || '',
                type: product.type || '',
                price: product.price || '',
                stock: product.stock || 0,
                description: product.description || '',
                image_url: product.img || ''
            });
        } else {
            setEditingProduct(null);
            setFormData({ name: '', type: '', price: '', stock: '', description: '', image_url: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const response = await apiService.uploadImage(file);
            if (response && response.url) {
                setFormData(prev => ({ ...prev, image_url: response.url }));
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error al subir la imagen. Comprueba la consola.");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock, 10)
            };

            if (editingProduct) {
                await apiService.updateProduct(editingProduct.id, payload);
            } else {
                await apiService.createProduct(payload);
            }
            handleCloseModal();
            fetchProducts(); // Refresh list
        } catch (error) {
            console.error("Error saving product:", error);
            alert("No se pudo guardar el producto. " + (error.message || ""));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Seguro que deseas eliminar este producto permanentemente?")) {
            try {
                await apiService.deleteProduct(id);
                setProducts(products.filter(p => p.id !== id));
            } catch (error) {
                console.error("Error deleting product:", error);
                alert("Error al eliminar el producto.");
            }
        }
    };

    return (
        <div>
            <div style={styles.header}>
                <h1 style={styles.pageTitle}>Gestión de Productos</h1>
                <button
                    style={styles.buttonPrimary}
                    onClick={() => handleOpenModal()}
                >
                    + Nuevo Producto
                </button>
            </div>

            <div style={styles.card}>
                {loading ? (
                    <p>Cargando productos...</p>
                ) : (
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
                                                src={product.img}
                                                alt={product.name}
                                                style={{ width: '40px', height: '40px', objectFit: 'contain', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '4px' }}
                                            />
                                        </td>
                                        <td style={{ ...styles.td, fontWeight: '600' }}>{product.name}</td>
                                        <td style={styles.td}>
                                            <span style={{ ...styles.badge, ...styles.badgeUser }}>{product.type}</span>
                                        </td>
                                        <td style={{ ...styles.td, fontWeight: '500' }}>${product.price}</td>
                                        <td style={styles.td}>{product.stock > 0 ? product.stock : 'Agotado'}</td>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    style={{ ...styles.buttonPrimary, padding: '6px 12px', fontSize: '12px', backgroundColor: '#e5e7eb', color: '#374151' }}
                                                    onClick={() => handleOpenModal(product)}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    style={{ ...styles.buttonDanger, padding: '6px 12px', fontSize: '12px' }}
                                                    onClick={() => handleDelete(product.id)}
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
                )}
            </div>

            {/* Form Modal */}
            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>

                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>
                                {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Nombre del Pokémon</label>
                                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} style={styles.input} placeholder="Pikachu, Charizard..." />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Tipo</label>
                                    <input required type="text" name="type" value={formData.type} onChange={handleInputChange} style={styles.input} placeholder="Electric, Fire..." />
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Stock Disponible</label>
                                    <input required type="number" name="stock" value={formData.stock} onChange={handleInputChange} style={styles.input} min="0" placeholder="10" />
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Precio ($)</label>
                                    <input required type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} style={styles.input} min="0" placeholder="29.99" />
                                </div>
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Fotografía del Producto</label>

                                <div style={styles.fileInputWrapper}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                        style={{ flex: 1, fontSize: '14px', color: '#475569' }}
                                    />
                                    {uploadingImage && <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>Cargando al servidor...</span>}
                                </div>

                                <input
                                    required
                                    type="url"
                                    name="image_url"
                                    value={formData.image_url}
                                    onChange={handleInputChange}
                                    style={{ ...styles.input, marginTop: '8px' }}
                                    placeholder="https://... o elige un archivo local"
                                />
                                {formData.image_url && (
                                    <div style={{ marginTop: '12px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc', width: 'fit-content' }}>
                                        <img src={formData.image_url} alt="Vista Previa" style={{ height: '80px', borderRadius: '4px', objectFit: 'contain' }} />
                                    </div>
                                )}
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Reseña Comercial (Descripción)</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }} placeholder="Escribe los detalles del producto..." />
                            </div>

                            <div style={styles.modalActions}>
                                <button type="button" onClick={handleCloseModal} style={{ ...styles.buttonPrimary, backgroundColor: '#f1f5f9', color: '#475569' }}>
                                    Descartar
                                </button>
                                <button type="submit" disabled={actionLoading} style={{ ...styles.buttonPrimary, padding: '10px 24px' }}>
                                    {actionLoading ? 'Guardando...' : (editingProduct ? 'Actualizar Producto' : 'Crear Producto')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducts;
