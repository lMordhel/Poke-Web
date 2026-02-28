import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/auth.context';
import { dashboardService as apiService } from '@/features/dashboard/services/dashboardService';

const ActivityContext = createContext(null);

export const ActivityProvider = ({ children }) => {
    const { user } = useAuth();
    const [activities, setActivities] = useState([]);

    // Load activities when component mounts or user changes
    useEffect(() => {
        let isMounted = true;

        const loadActivities = async () => {
            if (user && user.loggedIn) {
                try {
                    const data = await apiService.getActivities();
                    if (isMounted) setActivities(data || []);
                } catch (error) {
                    console.error('Error fetching activities:', error);
                    if (isMounted) setActivities([]);
                }
            } else {
                if (isMounted) setActivities([]);
            }
        };

        loadActivities();

        return () => {
            isMounted = false;
        };
    }, [user]);

    // Main method to save an activity event
    const logActivity = useCallback(async (type, title, description) => {
        if (!user || !user.loggedIn) return;

        const newActivityData = {
            type,
            title,
            description
        };

        try {
            const savedActivity = await apiService.postActivity(newActivityData);
            setActivities((prev) => {
                const updatedActivities = [savedActivity, ...prev].slice(0, 20);
                window.dispatchEvent(new CustomEvent('activityUpdated', { detail: savedActivity }));
                return updatedActivities;
            });
        } catch (error) {
            console.error('Failed to log activity backend:', error);
        }
    }, [user]);

    return (
        <ActivityContext.Provider value={{ activities, logActivity }}>
            {children}
        </ActivityContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useActivity = () => {
    const context = useContext(ActivityContext);
    if (!context) {
        throw new Error('useActivity must be used within an ActivityProvider');
    }
    return context;
};
