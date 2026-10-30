/**
 * Sesión del cliente.
 *
 * Regla del módulo (S19-S23): el servidor es la única fuente de verdad de la
 * sesión. `localStorage.currentUser` es solo una caché de conveniencia que
 * escribe el login y que se borra cuando `/auth/me` deja de reconocer la
 * sesión; ningún guardia decide a partir de ella.
 *
 * El módulo no importa React ni el cliente HTTP para poder probarse con
 * `node --test` sin DOM: recibe la función que consulta al backend y el
 * almacenamiento como dependencias.
 */

export const SESSION_CACHE_KEY = 'currentUser';

const LOGGED_IN = true;

/** Respuestas con las que el servidor dice "esta sesión ya no vale". */
const REVOKED_STATUSES = new Set([401, 403]);

/** Intentos totales de la consulta de arranque, incluido el primero. */
const DEFAULT_ATTEMPTS = 2;

/**
 * Normaliza la respuesta de `GET /auth/me` (UserOut) al shape que consume la UI.
 * `loggedIn` viaja con el objeto para que las cachés y consumidores existentes
 * (favoritos, actividad) sigan funcionando sin cambios.
 */
export const toSessionUser = (serverUser) => {
  const email = serverUser.email ?? '';
  const fallbackName = email.includes('@') ? email.split('@')[0] : email;

  return {
    id: serverUser.id,
    name: serverUser.name || fallbackName,
    email,
    role: serverUser.role ?? 'user',
    loggedIn: LOGGED_IN,
  };
};

/** Un usuario autenticado es aquel que el servidor acaba de confirmar. */
export const isAuthenticated = (user) => Boolean(user && user.loggedIn);

/** El rol que autoriza es el que devolvió el servidor, nunca el de la caché. */
export const isAdmin = (user) => isAuthenticated(user) && user.role === 'admin';

/** Escribe la caché de conveniencia; un almacenamiento bloqueado no rompe la sesión. */
export const cacheSession = (user, storage) => {
  try {
    storage.setItem(SESSION_CACHE_KEY, JSON.stringify(user));
    return true;
  } catch {
    return false;
  }
};

/** Borra la caché; devuelve true solo si había algo que borrar. */
export const clearCachedSession = (storage) => {
  try {
    if (storage.getItem(SESSION_CACHE_KEY) === null) return false;
    storage.removeItem(SESSION_CACHE_KEY);
    return true;
  } catch {
    return false;
  }
};

/**
 * Revalida la sesión al arrancar: 2xx confirma y refresca la caché, 401/403
 * niega y la borra, y un fallo transitorio (red o 5xx) se reintenta una vez
 * antes de quedar como sesión no verificada, con la caché intacta.
 */
export const restoreSession = async ({ fetchCurrentUser, storage, attempts = DEFAULT_ATTEMPTS }) => {
  let lastError = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const serverUser = await fetchCurrentUser();
      const user = toSessionUser(serverUser);
      cacheSession(user, storage);
      return { user, clearedCache: false, unavailable: false, error: null };
    } catch (error) {
      if (REVOKED_STATUSES.has(error?.status)) {
        return { user: null, clearedCache: clearCachedSession(storage), unavailable: false, error };
      }

      lastError = error;
    }
  }

  return { user: null, clearedCache: false, unavailable: true, error: lastError };
};

/**
 * Decisión de `ProtectedRoute`: 'wait' | 'login' | 'unavailable' | 'allow'.
 */
export const protectedRouteDecision = (user, loading, unavailable = false) => {
  if (loading) return 'wait';
  if (unavailable) return 'unavailable';
  if (!isAuthenticated(user)) return 'login';
  return 'allow';
};

/**
 * Decisión de `AdminRoute`: 'wait' | 'login' | 'unavailable' | 'dashboard' | 'allow'.
 */
export const adminRouteDecision = (user, loading, unavailable = false) => {
  const decision = protectedRouteDecision(user, loading, unavailable);
  if (decision !== 'allow') return decision;
  return isAdmin(user) ? 'allow' : 'dashboard';
};
