import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { adminStyles as styles } from '@/features/admin/admin.styles';
import { productService as apiService } from '@/features/products/services/productService';
import Pagination from '@/features/products/components/Pagination/Pagination';
import { nextPage, prevPage, productsQuery } from '@/features/products/pagination';
import { debounce } from '@/shared/utils/debounce';
import ProductTable from '../components/ProductTable';
import ProductFormModal from '../components/ProductFormModal';


const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    // Bumped after a write so the table refetches the page it is showing.
    const [reloadToken, setReloadToken] = useState(0);

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

    // Same 300 ms quiet period as the catalogue, so both search boxes behave
    // the same (S50, S53). A new term always returns to the first page.
    useEffect(() => {
        const handler = debounce((value) => {
            setDebouncedSearch(value.trim());
            setPage(1);
        }, 300);

        handler(searchInput);

        return () => handler.cancel();
    }, [searchInput]);

    useEffect(() => {
        let cancelled = false;

        const fetchProducts = async () => {
            setLoading(true);
            try {
                const data = await apiService.getProducts(
                    productsQuery({ page, search: debouncedSearch })
                );
                if (cancelled) return;

                setProducts(apiService.transformProductList(data?.products || []));
                setTotal(data?.total ?? 0);
                setPages(data?.pages ?? 0);

                // Deleting the last row of the last page leaves the table empty.
                if (page > 1 && page > (data?.pages ?? 0)) {
                    setPage(Math.max(data?.pages ?? 0, 1));
                }
            } catch (err) {
                console.error('Error fetching products', err);
                if (!cancelled) setProducts([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchProducts();

        return () => {
            cancelled = true;
        };
    }, [page, debouncedSearch, reloadToken]);

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
            setReloadToken((token) => token + 1); // Refresh list
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
                setReloadToken((token) => token + 1);
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
                <div style={styles.searchBar}>
                    <Search size={18} style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar producto por nombre..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        style={styles.searchInput}
                        aria-label="Buscar producto"
                    />
                </div>

                <p style={styles.tableMeta}>
                    {total} {total === 1 ? 'producto' : 'productos'}
                </p>

                {loading ? (
                    <p>Cargando productos...</p>
                ) : products.length === 0 ? (
                    <p style={styles.emptyRow}>
                        {debouncedSearch
                            ? `No hay productos que coincidan con "${debouncedSearch}".`
                            : 'Todavía no hay productos cargados.'}
                    </p>
                ) : (
                    <ProductTable
                        products={products}
                        onEdit={handleOpenModal}
                        onDelete={handleDelete}
                    />
                )}

                <Pagination
                    page={page}
                    pages={pages}
                    onPrev={() => setPage((current) => prevPage(current, pages))}
                    onNext={() => setPage((current) => nextPage(current, pages))}
                />
            </div>

            {/* Form Modal */}
            {isModalOpen && (
                <ProductFormModal
                    editingProduct={editingProduct}
                    formData={formData}
                    actionLoading={actionLoading}
                    uploadingImage={uploadingImage}
                    handleCloseModal={handleCloseModal}
                    handleSubmit={handleSubmit}
                    handleInputChange={handleInputChange}
                    handleAddVariant={handleAddVariant}
                    handleRemoveVariant={handleRemoveVariant}
                    handleVariantChange={handleVariantChange}
                    handleImageUpload={handleImageUpload}
                />
            )}
        </div>
    );
};

export default AdminProducts;
