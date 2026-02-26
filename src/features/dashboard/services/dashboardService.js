import { apiClient } from '@/lib/axios';

export const dashboardService = {
    getActivities: async () => {
        return apiClient('/activity/user');
    },

    postActivity: async (activityData) => {
        return apiClient('/activity/', {
            method: 'POST',
            body: JSON.stringify(activityData),
        });
    },

    getFavorites: async (userEmail) => {
        const favoritesKey = `favorites_${userEmail}`;
        return JSON.parse(localStorage.getItem(favoritesKey) || '[]');
    },

    updateUserProfile: async (userId, userData) => {
        return apiClient(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }
};
