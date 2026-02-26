import { apiClient } from '@/lib/axios';

export const authService = {
    login: async (credentials) => {
        const response = await apiClient('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        return response;
    },

    register: async (userData) => {
        return apiClient('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    getCurrentUser: async () => {
        return apiClient('/auth/me');
    },

    logout: async () => {
        return apiClient('/auth/logout', {
            method: 'POST'
        });
    }
};
