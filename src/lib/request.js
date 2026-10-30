/**
 * Reintento con refresh (S26-S29).
 *
 * Regla: un 401 en una petición normal significa "el access token caducó", no
 * "la sesión murió". Se pide un refresh una sola vez y se reintenta la petición
 * original una sola vez. Los endpoints de autenticación quedan fuera, para no
 * encadenar refrescos ni bucles, y cualquier otro error no toca el refresh.
 *
 * Módulo puro (sin `window`, sin `fetch` global) para poder probarlo con
 * `node --test`: el transporte y el refresh llegan como dependencias.
 */

/** Endpoints que ya son parte del flujo de autenticación. */
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

export const shouldAttemptRefresh = (endpoint, status, alreadyRetried) => {
  if (status !== 401 || alreadyRetried) return false;
  return !AUTH_ENDPOINTS.some((authEndpoint) => endpoint.startsWith(authEndpoint));
};

/**
 * Ejecuta la petición y, si procede, la reintenta una vez tras refrescar.
 *
 * @param {object} options
 * @param {string} options.endpoint ruta relativa a la API.
 * @param {object} options.config opciones de `fetch` (método, cabeceras, body).
 * @param {(endpoint: string, config: object) => Promise<Response>} options.fetchImpl
 * @param {() => Promise<boolean>} options.refreshSession devuelve si el refresh funcionó.
 * @param {boolean} [options.alreadyRetried]
 * @returns {Promise<Response>} la respuesta final, la original si el refresh falla.
 */
export const executeRequest = async ({
  endpoint,
  config,
  fetchImpl,
  refreshSession,
  alreadyRetried = false,
}) => {
  const response = await fetchImpl(endpoint, config);

  if (!shouldAttemptRefresh(endpoint, response.status, alreadyRetried)) {
    return response;
  }

  const refreshed = await refreshSession();
  if (!refreshed) return response;

  return executeRequest({
    endpoint,
    config,
    fetchImpl,
    refreshSession,
    alreadyRetried: true,
  });
};
