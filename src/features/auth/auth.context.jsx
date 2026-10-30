import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from './services/authService';
import { cacheSession, restoreSession, toSessionUser } from './session';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    return useContext(AuthContext);
};

/**
 * Proveedor de sesión.
 *
 * Desde T7 la autoridad es el backend: al montar se consulta `/auth/me` y el
 * usuario del contexto sale de esa respuesta. `localStorage.currentUser` queda
 * como caché de conveniencia (favoritos y actividad la leen), nunca como prueba
 * de que haya sesión.
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const revalidate = useCallback(async () => {
        const { user: sessionUser } = await restoreSession({
            fetchCurrentUser: authService.getCurrentUser,
            storage: window.localStorage,
        });
        setUser(sessionUser);
        return sessionUser;
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadSession = async () => {
            const { user: sessionUser } = await restoreSession({
                fetchCurrentUser: authService.getCurrentUser,
                storage: window.localStorage,
            });

            if (!cancelled) {
                setUser(sessionUser);
                setLoading(false);
            }
        };

        loadSession();

        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback((userData) => {
        const currentUserData = toSessionUser(userData);
        cacheSession(currentUserData, window.localStorage);
        setUser(currentUserData);
    }, []);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch (e) {
            console.error(e);
        } finally {
            window.localStorage.removeItem('currentUser');
            setUser(null);
        }
    }, []);

    const value = {
        user,
        login,
        logout,
        revalidate,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
