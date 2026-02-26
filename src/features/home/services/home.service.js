import { apiClient } from '@/lib/axios';

export const homeService = {
    getHomeData: async () => {
        return apiClient('/home/');
    }
};
