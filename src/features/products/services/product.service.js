import { apiClient } from '@/lib/axios';

export const productService = {
    getProducts: async (params) => {
        const queryParams = new URLSearchParams();
        if (params?.type && params.type !== 'Todos') queryParams.append('type', params.type);
        if (params?.search) queryParams.append('search', params.search);

        return apiClient(`/products/?${queryParams.toString()}`);
    },

    getProductBySlug: async (slug) => {
        return apiClient(`/products/slug/${slug}`);
    }
};
