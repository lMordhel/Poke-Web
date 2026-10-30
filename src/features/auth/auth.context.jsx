import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from './services/authService';
import { SESSION_EXPIRED_EVENT } from '@/lib/axios';
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
    /** `/auth/me` no pudo responder (red o 5xx): la sesión no está confirmada ni negada. */
    const [unavailable, setUnavailable] = useState(false);

    const applySession = useCallback((result) => {
        if (result.error) {
            console.warn('[auth] no se pudo verificar la sesión:', result.error.message);
        }

        setUser(result.user);
        setUnavailable(result.unavailable);
        setLoading(false);
        return result;
    }, []);

    const revalidate = useCallback(async () => {
        return applySession(await restoreSession({
            fetchCurrentUser: authService.getCurrentUser,
            storage: window.localStorage,
        }));
    }, [applySession]);

    useEffect(() => {
        let cancelled = false;

        const loadSession = async () => {
            const result = await restoreSession({
                fetchCurrentUser: authService.getCurrentUser,
                storage: window.localStorage,
            });

            if (!cancelled) applySession(result);
        };

        loadSession();

        return () => {
            cancelled = true;
        };
    }, [applySession]);

    const login = useCallback((userData) => {
        const currentUserData = toSessionUser(userData);
        cacheSession(currentUserData, window.localStorage);
        setUser(currentUserData);
        setUnavailable(false);
    }, []);

    /**
     * Logout limpio cuando el cliente se queda sin sesión (S27): el servidor ya
     * rechazó el refresh, así que solo se limpia el estado local, sin otra
     * llamada de red ni bucle.
     */
    useEffect(() => {
        const handleExpired = () => {
            window.localStorage.removeItem('currentUser');
            setUser(null);
            setUnavailable(false);
        };

        window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
        return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    }, []);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch (e) {
            console.error(e);
        } finally {
            window.localStorage.removeItem('currentUser');
            setUser(null);
            setUnavailable(false);
        }
    }, []);

    const value = {
        user,
        login,
        logout,
        revalidate,
        unavailable,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
