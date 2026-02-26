import { apiClient } from '@/lib/axios';

export const productService = {
    getProducts: async (params = {}) => {
        const searchParams = new URLSearchParams(params);
        const endpoint = `/products${searchParams.toString() ? '?' + searchParams : ''}`;
        return apiClient(endpoint);
    },

    getProduct: async (id) => {
        return apiClient(`/products/${id}`);
    },

    createProduct: async (productData) => {
        return apiClient('/products/', {
            method: 'POST',
            body: JSON.stringify(productData),
        });
    },

    updateProduct: async (id, productData) => {
        return apiClient(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData),
        });
    },

    deleteProduct: async (id) => {
        return apiClient(`/products/${id}`, {
            method: 'DELETE',
        });
    },

    getProductTypes: async () => {
        return apiClient('/products/types/list');
    },

    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        return apiClient('/products/upload-image', {
            method: 'POST',
            body: formData,
        });
    },

    transformProduct: (product) => {
        return {
            ...product,
            id: product.id,
            name: product.name,
            price: typeof product.price === 'number' ? product.price.toFixed(2) : product.price,
            type: product.type,
            img: product.image_url,
            isNew: product.is_new,
            description: product.description,
            stock: product.stock,
        };
    },

    transformProductList: (products) => {
        if (!Array.isArray(products)) return [];
        return products.map(p => productService.transformProduct(p));
    }
};
