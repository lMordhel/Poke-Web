import { useState, useEffect } from 'react';
import { productService } from '../services/product.service';

export const useProductDetail = (slug) => {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        if (!slug) return;

        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await productService.getProductBySlug(slug);

                // Map image_url to img if needed for consistency with ProductCard
                if (data && data.image_url && !data.img) {
                    data.img = data.image_url;
                }

                if (isMounted) {
                    setProduct(data);
                }
            } catch (err) {
                console.error("Error fetching product by slug:", err);
                if (isMounted) {
                    setError(err.message || 'Product not found');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchProduct();

        return () => {
            isMounted = false;
        };
    }, [slug]);

    return { product, loading, error };
};
