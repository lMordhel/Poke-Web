import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from './services/authService';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Cargar usuario inicial
        const loadUser = () => {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    if (parsed.loggedIn) {
                        setUser(parsed);
                    }
                } catch (e) {
                    console.error("Error parsing stored user", e);
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = (userData) => {
        const currentUserData = {
            ...userData,
            loggedIn: true
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUserData));
        setUser(currentUserData);
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (e) {
            console.error(e);
        } finally {
            localStorage.removeItem('currentUser');
            setUser(null);
            // Redirección o limpiar dependencias aquí
        }
    };

    const value = {
        user,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
