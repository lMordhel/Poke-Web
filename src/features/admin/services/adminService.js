import { apiClient } from '@/lib/axios';

export const adminService = {
    getUsers: async () => {
        return apiClient('/admin/users');
    },

    getAdminStats: async () => {
        return apiClient('/admin/stats');
    }
};
