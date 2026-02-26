import { useEffect, useState } from 'react';
import { adminStyles as styles } from '@/features/admin/admin.styles';
import { productService as apiService } from '@/features/products/services/productService';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal and Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        type: '',
        short_description: '',
        long_description: '',
        featured: false,
        sold_count: 0,
        image_url: '',
        images_input: '',
        variants: []
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
                slug: product.slug || '',
                type: product.type || '',
                short_description: product.short_description || product.description || '',
                long_description: product.long_description || '',
                featured: product.featured || false,
                sold_count: product.sold_count || 0,
                image_url: product.img || product.image_url || '',
                images_input: product.images ? product.images.join(', ') : '',
                variants: product.variants || []
            });
        } else {
            setEditingProduct(null);
            setFormData({ name: '', slug: '', type: '', short_description: '', long_description: '', featured: false, sold_count: 0, image_url: '', images_input: '', variants: [] });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddVariant = () => {
        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, { size: '', price: 0, stock: 0 }]
        }));
    };

    const handleRemoveVariant = (index) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
    };

    const handleVariantChange = (index, field, value) => {
        setFormData(prev => {
            const newVariants = [...prev.variants];
            newVariants[index] = { ...newVariants[index], [field]: value };
            return { ...prev, variants: newVariants };
        });
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

        if (formData.variants.length === 0) {
            alert("Debes agregar al menos una variante (tamaño, precio, stock) al producto.");
            return;
        }

        // Validar tamaños no duplicados
        const sizes = formData.variants.map(v => v.size.trim().toLowerCase());
        if (new Set(sizes).size !== sizes.length) {
            alert("No pueden existir variantes con el mismo tamaño duplicado.");
            return;
        }

        setActionLoading(true);
        try {
            const payload = {
                ...formData,
                price: Math.min(...formData.variants.map(v => parseFloat(v.price) || 0)),
                stock: formData.variants.reduce((acc, v) => acc + (parseInt(v.stock, 10) || 0), 0),
                sold_count: parseInt(formData.sold_count, 10) || 0,
                description: formData.short_description,
                images: formData.images_input.split(',').map(url => url.trim()).filter(url => url),
                variants: formData.variants.map(v => ({
                    size: v.size.trim(),
                    price: parseFloat(v.price),
                    stock: parseInt(v.stock, 10)
                }))
            };

            // Remove slug if empty so backend auto-generates it
            if (!payload.slug) {
                delete payload.slug;
            }

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
                                        <td style={{ ...styles.td, fontWeight: '500' }}>
                                            ${product.variants && product.variants.length > 0
                                                ? Math.min(...product.variants.map(v => v.price)).toFixed(2)
                                                : product.price || 0}
                                        </td>
                                        <td style={styles.td}>
                                            {product.variants && product.variants.length > 0
                                                ? product.variants.reduce((acc, v) => acc + v.stock, 0)
                                                : product.stock || 0}
                                        </td>
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Nombre del Pokémon</label>
                                    <input required type="text" name="name" value={formData.name} onChange={handleInputChange} style={styles.input} placeholder="Pikachu, Charizard..." />
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Slug URL (Opcional - Autogenerado)</label>
                                    <input type="text" name="slug" value={formData.slug} onChange={handleInputChange} style={styles.input} placeholder="pikachu-plush-20cm" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Tipo</label>
                                    <input required type="text" name="type" value={formData.type} onChange={handleInputChange} style={styles.input} placeholder="Electric, Fire..." />
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Ventas (Sold Count)</label>
                                    <input required type="number" name="sold_count" value={formData.sold_count} onChange={handleInputChange} style={styles.input} min="0" placeholder="0" />
                                </div>
                            </div>

                            {/* Variantes Dinámicas */}
                            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>Variantes (Tamaños, Precios, Stock)</h3>
                                    <button type="button" onClick={handleAddVariant} style={{ ...styles.buttonPrimary, padding: '6px 12px', fontSize: '13px' }}>
                                        + Agregar Variante
                                    </button>
                                </div>

                                {formData.variants.length === 0 ? (
                                    <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', margin: '20px 0' }}>No hay variantes. Debes agregar al menos una.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {formData.variants.map((variant, index) => (
                                            <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr auto', gap: '12px', alignItems: 'end', backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <div>
                                                    <label style={{ ...styles.label, fontSize: '12px', marginBottom: '4px' }}>Tamaño (ej: 20cm)</label>
                                                    <input required type="text" value={variant.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)} style={{ ...styles.input, padding: '8px' }} placeholder="20cm" />
                                                </div>
                                                <div>
                                                    <label style={{ ...styles.label, fontSize: '12px', marginBottom: '4px' }}>Stock</label>
                                                    <input required type="number" value={variant.stock} min="0" onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} style={{ ...styles.input, padding: '8px' }} placeholder="10" />
                                                </div>
                                                <div>
                                                    <label style={{ ...styles.label, fontSize: '12px', marginBottom: '4px' }}>Precio ($)</label>
                                                    <input required type="number" step="0.01" value={variant.price} min="0" onChange={(e) => handleVariantChange(index, 'price', e.target.value)} style={{ ...styles.input, padding: '8px' }} placeholder="29.99" />
                                                </div>
                                                <button type="button" onClick={() => handleRemoveVariant(index)} style={{ ...styles.buttonDanger, padding: '8px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Eliminar variante">
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
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

                                <label style={{ ...styles.label, marginTop: '16px' }}>Imágenes Adicionales para Galería (opcional)</label>
                                <textarea name="images_input" value={formData.images_input} onChange={handleInputChange} style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }} placeholder="https://url1.jpg, https://url2.jpg (Separadas por comas)" />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Descripción Corta</label>
                                <textarea required name="short_description" value={formData.short_description} onChange={handleInputChange} style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }} placeholder="Resumen breve del producto..." />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Descripción Detallada (HTML opcional)</label>
                                <textarea required name="long_description" value={formData.long_description} onChange={handleInputChange} style={{ ...styles.input, minHeight: '120px', resize: 'vertical' }} placeholder="<p>Tamaños disponibles: 20cm, 35cm, 50cm...</p>" />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="checkbox" id="featured" name="featured" checked={formData.featured} onChange={handleInputChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                <label htmlFor="featured" style={{ ...styles.label, marginBottom: 0, cursor: 'pointer' }}>Marcar como Producto Destacado</label>
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
