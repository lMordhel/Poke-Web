import React from 'react';
import { adminStyles as styles } from '@/features/admin/admin.styles';

const ProductFormModal = ({
    editingProduct,
    formData,
    actionLoading,
    uploadingImage,
    handleCloseModal,
    handleSubmit,
    handleInputChange,
    handleAddVariant,
    handleRemoveVariant,
    handleVariantChange,
    handleImageUpload
}) => {
    return (
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
                            <label style={styles.label} htmlFor="productName">Nombre del Pokémon</label>
                            <input id="productName" required type="text" name="name" value={formData.name} onChange={handleInputChange} style={styles.input} placeholder="Pikachu, Charizard..." />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label} htmlFor="productSlug">Slug URL (Opcional - Autogenerado)</label>
                            <input id="productSlug" type="text" name="slug" value={formData.slug} onChange={handleInputChange} style={styles.input} placeholder="pikachu-plush-20cm" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label} htmlFor="productType">Tipo</label>
                            <input id="productType" required type="text" name="type" value={formData.type} onChange={handleInputChange} style={styles.input} placeholder="Electric, Fire..." />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label} htmlFor="productSoldCount">Ventas (Sold Count)</label>
                            <input id="productSoldCount" required type="number" name="sold_count" value={formData.sold_count} onChange={handleInputChange} style={styles.input} min="0" placeholder="0" />
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
                                    <div key={variant.id || index} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr auto', gap: '12px', alignItems: 'end', backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div>
                                            <label style={{ ...styles.label, fontSize: '12px', marginBottom: '4px' }} htmlFor={`size-${index}`}>Tamaño (ej: 20cm)</label>
                                            <input id={`size-${index}`} required type="text" value={variant.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)} style={{ ...styles.input, padding: '8px' }} placeholder="20cm" />
                                        </div>
                                        <div>
                                            <label style={{ ...styles.label, fontSize: '12px', marginBottom: '4px' }} htmlFor={`stock-${index}`}>Stock</label>
                                            <input id={`stock-${index}`} required type="number" value={variant.stock} min="0" onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} style={{ ...styles.input, padding: '8px' }} placeholder="10" />
                                        </div>
                                        <div>
                                            <label style={{ ...styles.label, fontSize: '12px', marginBottom: '4px' }} htmlFor={`price-${index}`}>Precio ($)</label>
                                            <input id={`price-${index}`} required type="number" step="0.01" value={variant.price} min="0" onChange={(e) => handleVariantChange(index, 'price', e.target.value)} style={{ ...styles.input, padding: '8px' }} placeholder="29.99" />
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
                        <label style={styles.label} htmlFor="productImage">Fotografía del Producto</label>

                        <div style={styles.fileInputWrapper}>
                            <input
                                id="productImage"
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

                        <label style={{ ...styles.label, marginTop: '16px' }} htmlFor="productImagesInput">Imágenes Adicionales para Galería (opcional)</label>
                        <textarea id="productImagesInput" name="images_input" value={formData.images_input} onChange={handleInputChange} style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }} placeholder="https://url1.jpg, https://url2.jpg (Separadas por comas)" />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label} htmlFor="shortDesc">Descripción Corta</label>
                        <textarea id="shortDesc" required name="short_description" value={formData.short_description} onChange={handleInputChange} style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }} placeholder="Resumen breve del producto..." />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label} htmlFor="longDesc">Descripción Detallada (HTML opcional)</label>
                        <textarea id="longDesc" required name="long_description" value={formData.long_description} onChange={handleInputChange} style={{ ...styles.input, minHeight: '120px', resize: 'vertical' }} placeholder="<p>Tamaños disponibles: 20cm, 35cm, 50cm...</p>" />
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
    );
};

export default ProductFormModal;
