const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
    console.warn('⚠️ VITE_API_BASE_URL is not defined');
}

export const clearToken = () => {
    localStorage.removeItem('currentUser');
};

export const apiClient = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

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
        const response = await fetch(url, config);

        if (!response.ok) {
            if (response.status === 401) {
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
