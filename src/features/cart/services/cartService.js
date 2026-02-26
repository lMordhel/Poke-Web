import { apiClient } from '@/lib/axios';

export const cartService = {
    getOrders: async () => {
        return apiClient('/orders/');
    },

    createOrder: async (orderData) => {
        return apiClient('/orders/', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
    }
};
