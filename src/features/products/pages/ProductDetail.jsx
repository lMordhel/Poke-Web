import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductDetail } from '../hooks/useProductDetail';
import { ShoppingCart, Star, Box, ChevronLeft, Truck, Shield } from 'lucide-react';
import { useCart } from '@/features/cart';
import { useAuth } from '@/features/auth';
import ProductCard from '@/features/products/components/ProductCard/ProductCard';
import { productService } from '../services/product.service';

const ProductDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { product, loading, error } = useProductDetail(slug);
    const { addToCart } = useCart();
    const { user } = useAuth();

    // Quantity state
    const [quantity, setQuantity] = useState(1);

    // Variant state
    const [selectedVariant, setSelectedVariant] = useState(null);


    // Main image state (supports multiple images later)
    const [mainImage, setMainImage] = useState('');

    // Related products
    const [relatedProducts, setRelatedProducts] = useState([]);

    React.useEffect(() => {
        if (product) {
            setMainImage(product.img || product.image_url);

            // Initialize variant if variants exist
            if (product.variants && product.variants.length > 0) {
                setSelectedVariant(product.variants[0]);
            } else {
                setSelectedVariant(null);
            }

            // fetch related products
            productService.getProducts({ type: product.type }).then(res => {
                if (res && res.products) {
                    setRelatedProducts(res.products.filter(p => p.id !== product.id).slice(0, 4));
                }
            }).catch(console.error);
        }
    }, [product]);

    const handleAddToCart = () => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Add multiple if quantity > 1 (Depending on how useCart handles it, usually you loop or pass quantity)
        const cartPayload = selectedVariant
            ? { ...product, size: selectedVariant.size, price: selectedVariant.price }
            : product;

        for (let i = 0; i < quantity; i++) {
            addToCart(cartPayload);
        }

        const sizeText = selectedVariant ? ` (${selectedVariant.size})` : '';
        alert(`${quantity} ${product.name}${sizeText} agregado(s) al carrito!`);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: '#f4f4f5' }}>
                <div className="pokeball-spinner" style={{ width: 60, height: 60 }}></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', backgroundColor: '#f4f4f5' }}>
                <h2>Producto no encontrado</h2>
                <p style={{ color: '#6b7280', marginBottom: '20px' }}>{error || 'El producto que buscas no existe o fue eliminado.'}</p>
                <button
                    onClick={() => navigate('/catalogo')}
                    style={{ padding: '10px 20px', backgroundColor: '#FFD600', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Volver al catálogo
                </button>
            </div>
        );
    }

    const hasRichDescription = product.long_description && product.long_description.length > 10;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f4f4f5', padding: '40px 20px', paddingTop: '100px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '30px', color: '#6b7280', fontSize: '14px' }}>
                    <button onClick={() => navigate('/catalogo')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
                        <ChevronLeft size={16} /> Catálogo
                    </button>
                    <span>/</span>
                    <span>{product.type}</span>
                    <span>/</span>
                    <span style={{ color: '#111827', fontWeight: '500' }}>{product.name}</span>
                </div>

                {/* Top Section: Split Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', backgroundColor: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>

                    {/* Left: Images */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#f3f4f6', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                            {mainImage ? (
                                <img src={mainImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Box size={64} color="#9ca3af" />
                            )}
                        </div>
                        {/* Image Gallery (thumbnails) */}
                        {product.images && product.images.length > 0 && (
                            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                                {[product.img || product.image_url, ...product.images].filter((v, i, a) => a.indexOf(v) === i).map((imgUrl, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setMainImage(imgUrl)}
                                        style={{
                                            width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', padding: 0,
                                            border: mainImage === imgUrl ? '2px solid #3b82f6' : '2px solid transparent',
                                            cursor: 'pointer', flexShrink: 0, backgroundColor: '#f3f4f6'
                                        }}
                                    >
                                        <img src={imgUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`thumbnail ${idx}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Info */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                            <span style={{ padding: '6px 12px', backgroundColor: '#f3f4f6', borderRadius: '99px', fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>
                                {product.type}
                            </span>
                            {product.is_new && (
                                <span style={{ padding: '6px 12px', backgroundColor: '#ef4444', borderRadius: '99px', fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                                    Nuevo
                                </span>
                            )}
                            {product.featured && (
                                <span style={{ padding: '6px 12px', backgroundColor: '#FFD600', borderRadius: '99px', fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                                    Destacado
                                </span>
                            )}
                        </div>

                        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginBottom: '16px', lineHeight: '1.2' }}>
                            {product.name}
                        </h1>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', color: '#FFD700' }}>
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} fill="#FFD700" />)}
                            </div>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>(124 opiniones)</span>
                            <span style={{ margin: '0 8px', color: '#d1d5db' }}>|</span>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>{product.sold_count || 0} vendidos</span>
                        </div>

                        {/* Variant Selector */}
                        {product.variants && product.variants.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', marginBottom: '12px' }}>
                                    Tamaño / Variante
                                </div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {product.variants.map((variant, idx) => {
                                        const isSelected = selectedVariant && selectedVariant.size === variant.size;
                                        const isOutOfStock = variant.stock === 0;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedVariant(variant)}
                                                disabled={isOutOfStock}
                                                style={{
                                                    padding: '8px 20px',
                                                    borderRadius: '12px',
                                                    border: isSelected ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                                    backgroundColor: isSelected ? '#eff6ff' : '#fff',
                                                    color: isOutOfStock ? '#d1d5db' : (isSelected ? '#1d4ed8' : '#4b5563'),
                                                    fontWeight: '600',
                                                    fontSize: '14px',
                                                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s',
                                                    opacity: isOutOfStock ? 0.6 : 1
                                                }}
                                            >
                                                {variant.size}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div style={{ fontSize: '36px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                            ${selectedVariant ? selectedVariant.price : product.price}
                        </div>

                        <p style={{ fontSize: '16px', color: '#4b5563', marginBottom: '32px', lineHeight: '1.6' }}>
                            {product.short_description || product.description || "Un peluche increíble de la colección oficial. Perfecto para coleccionistas o como regalo ideal."}
                        </p>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: (selectedVariant ? selectedVariant.stock : product.stock) > 0 ? '#10b981' : '#ef4444', fontWeight: '500' }}>
                                <Box size={18} />
                                {(selectedVariant ? selectedVariant.stock : product.stock) > 0 ? `${selectedVariant ? selectedVariant.stock : product.stock} disponibles en stock` : 'Agotado'}
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                {/* Quantity selector */}
                                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '4px' }}>
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        style={{ width: '40px', height: '40px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#4b5563' }}
                                    >-</button>
                                    <span style={{ width: '40px', textAlign: 'center', fontWeight: '600' }}>{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(Math.min((selectedVariant ? selectedVariant.stock : product.stock), quantity + 1))}
                                        disabled={quantity >= (selectedVariant ? selectedVariant.stock : product.stock)}
                                        style={{ width: '40px', height: '40px', border: 'none', background: 'none', fontSize: '20px', cursor: quantity >= (selectedVariant ? selectedVariant.stock : product.stock) ? 'not-allowed' : 'pointer', color: quantity >= (selectedVariant ? selectedVariant.stock : product.stock) ? '#9ca3af' : '#4b5563' }}
                                    >+</button>
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    disabled={(selectedVariant ? selectedVariant.stock : product.stock) === 0}
                                    style={{
                                        flex: 1, height: '48px', backgroundColor: (selectedVariant ? selectedVariant.stock : product.stock) === 0 ? '#e5e7eb' : '#FFD600',
                                        color: (selectedVariant ? selectedVariant.stock : product.stock) === 0 ? '#9ca3af' : '#111827',
                                        border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '16px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        cursor: (selectedVariant ? selectedVariant.stock : product.stock) === 0 ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s', boxShadow: (selectedVariant ? selectedVariant.stock : product.stock) > 0 ? '0 4px 14px rgba(255, 214, 0, 0.4)' : 'none'
                                    }}
                                >
                                    <ShoppingCart size={20} />
                                    {(selectedVariant ? selectedVariant.stock : product.stock) === 0 ? 'Sin Stock' : 'Agregar al carrito'}
                                </button>
                            </div>
                        </div>

                        {/* Badges */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ecfdf5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Truck size={20} color="#10b981" />
                                </div>
                                <div style={{ fontSize: '13px', color: '#4b5563' }}>Envío Rápido<br /><strong style={{ color: '#111827' }}>24-48 hrs</strong></div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Shield size={20} color="#3b82f6" />
                                </div>
                                <div style={{ fontSize: '13px', color: '#4b5563' }}>Pago Seguro<br /><strong style={{ color: '#111827' }}>100% Protegido</strong></div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Long Description Section */}
                {hasRichDescription && (
                    <div style={{ marginTop: '40px', backgroundColor: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>Descripción del Producto</h2>
                        {/* We use dangerouslySetInnerHTML to allow rich text/html from the admin panel */}
                        <div
                            style={{ color: '#4b5563', lineHeight: '1.8', fontSize: '16px' }}
                            dangerouslySetInnerHTML={{ __html: product.long_description }}
                        />
                    </div>
                )}

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div style={{ marginTop: '60px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>Productos Relacionados</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                            {relatedProducts.map(p => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;
