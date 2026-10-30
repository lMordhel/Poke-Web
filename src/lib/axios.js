import { executeRequest } from '@/lib/request';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
    console.warn('⚠️ VITE_API_BASE_URL is not defined');
}

/** Evento con el que el cliente avisa que la sesión dejó de valer (S27). */
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

export const clearToken = () => {
    localStorage.removeItem('currentUser');
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
};

/**
 * Pide un refresh. Va por `fetch` directo, no por `apiClient`, para no
 * recursar: el propio `/auth/refresh` nunca dispara otro refresh (S28).
 */
const refreshSession = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        });
        return response.ok;
    } catch {
        return false;
    }
};

export const apiClient = async (endpoint, options = {}) => {
    const config = {
        headers: {
            ...options.headers,
        },
        credentials: 'include', // Clave para enviar cookies en fetch
        ...options,
    };

    if (!(options.body instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
    }

    try {
        // Un 401 se reintenta una vez tras refrescar; ver `src/lib/request.js`.
        const response = await executeRequest({
            endpoint,
            config,
            fetchImpl: (path, requestConfig) => fetch(`${API_BASE_URL}${path}`, requestConfig),
            refreshSession,
        });

        if (!response.ok) {
            if (response.status === 401) {
                // El refresh no sirvió: logout limpio y una sola notificación.
                clearToken();
            }

            let message = `HTTP Error ${response.status}`;

            try {
                const data = await response.json();
                message = data?.detail || message;
            } catch {
                // ignore
            }

            const error = new Error(message);
            error.status = response.status;
            throw error;
        }

        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            return await response.json();
        }

        return null;
    } catch (error) {
        console.error('[API CLIENT] Request failed:', error);
        throw error;
    }
};
