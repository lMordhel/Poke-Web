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
 * Revalida la sesión contra el backend al arrancar la aplicación.
 *
 * @param {object} options
 * @param {() => Promise<object>} options.fetchCurrentUser consulta a `/auth/me`.
 * @param {Storage} options.storage normalmente `window.localStorage`.
 * @returns {Promise<{user: object|null, clearedCache: boolean}>}
 */
export const restoreSession = async ({ fetchCurrentUser, storage }) => {
  try {
    const serverUser = await fetchCurrentUser();
    const user = toSessionUser(serverUser);
    cacheSession(user, storage);
    return { user, clearedCache: false };
  } catch {
    // 401 por sesión caducada, 5xx o caída de red: en los tres casos la copia
    // local no prueba nada, así que se descarta y el guardia manda a /login.
    const clearedCache = clearCachedSession(storage);
    return { user: null, clearedCache };
  }
};

/**
 * Decisión de `ProtectedRoute`: 'wait' | 'login' | 'allow'.
 */
export const protectedRouteDecision = (user, loading) => {
  if (loading) return 'wait';
  if (!isAuthenticated(user)) return 'login';
  return 'allow';
};

/**
 * Decisión de `AdminRoute`: 'wait' | 'login' | 'dashboard' | 'allow'.
 */
export const adminRouteDecision = (user, loading) => {
  if (loading) return 'wait';
  if (!isAuthenticated(user)) return 'login';
  if (!isAdmin(user)) return 'dashboard';
  return 'allow';
};
