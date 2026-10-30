import { test } from 'node:test';
import assert from 'node:assert/strict';

import { executeRequest, shouldAttemptRefresh } from './request.js';

/** Respuesta mínima con la forma que consume `executeRequest`. */
const response = (status, body = {}) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => body,
});

const base = {
  endpoint: '/orders',
  config: { method: 'GET' },
};

// S26: 401 → refresh → reintento único de la petición original.
test('S26 un 401 reintenta la petición original después de refrescar', async () => {
  const calls = [];
  const fetchImpl = async (endpoint, config) => {
    calls.push({ endpoint, config });
    return calls.length === 1 ? response(401) : response(200, { ok: true });
  };

  let refreshes = 0;
  const refreshSession = async () => {
    refreshes += 1;
    return true;
  };

  const result = await executeRequest({ ...base, fetchImpl, refreshSession });

  assert.equal(result.status, 200);
  assert.equal(refreshes, 1);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].endpoint, '/orders');
  assert.equal(calls[1].config, base.config);
});

// S27: si el refresh falla no hay reintento ni bucle; el 401 llega al llamador.
test('S27 si el refresh falla se devuelve el 401 original sin reintentar', async () => {
  let fetches = 0;
  const fetchImpl = async () => {
    fetches += 1;
    return response(401);
  };

  const result = await executeRequest({
    ...base,
    fetchImpl,
    refreshSession: async () => false,
  });

  assert.equal(result.status, 401);
  assert.equal(fetches, 1);
});

test('S27 si el reintento vuelve a dar 401 no se refresca una segunda vez', async () => {
  let fetches = 0;
  let refreshes = 0;
  const fetchImpl = async () => {
    fetches += 1;
    return response(401);
  };

  const result = await executeRequest({
    ...base,
    fetchImpl,
    refreshSession: async () => {
      refreshes += 1;
      return true;
    },
  });

  assert.equal(result.status, 401);
  assert.equal(refreshes, 1);
  assert.equal(fetches, 2);
});

// S28: los endpoints de autenticación nunca disparan refresh.
test('S28 los endpoints de autenticación no disparan refresh', async () => {
  for (const endpoint of ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']) {
    let refreshes = 0;
    let fetches = 0;

    const result = await executeRequest({
      endpoint,
      config: {},
      fetchImpl: async () => {
        fetches += 1;
        return response(401);
      },
      refreshSession: async () => {
        refreshes += 1;
        return true;
      },
    });

    assert.equal(result.status, 401);
    assert.equal(refreshes, 0, `${endpoint} no debe refrescar`);
    assert.equal(fetches, 1, `${endpoint} no debe reintentar`);
  }
});

// S29: solo un 401 justifica el refresh.
test('S29 otros errores no disparan refresh ni reintento', async () => {
  for (const status of [400, 403, 500]) {
    let refreshes = 0;
    let fetches = 0;

    const result = await executeRequest({
      ...base,
      fetchImpl: async () => {
        fetches += 1;
        return response(status);
      },
      refreshSession: async () => {
        refreshes += 1;
        return true;
      },
    });

    assert.equal(result.status, status);
    assert.equal(refreshes, 0);
    assert.equal(fetches, 1);
  }
});

test('S29 un 200 no toca el refresh', async () => {
  let refreshes = 0;

  const result = await executeRequest({
    ...base,
    fetchImpl: async () => response(200),
    refreshSession: async () => {
      refreshes += 1;
      return true;
    },
  });

  assert.equal(result.status, 200);
  assert.equal(refreshes, 0);
});

test('S26 shouldAttemptRefresh describe la regla completa', () => {
  assert.equal(shouldAttemptRefresh('/orders', 401, false), true);
  assert.equal(shouldAttemptRefresh('/orders', 401, true), false);
  assert.equal(shouldAttemptRefresh('/orders', 403, false), false);
  assert.equal(shouldAttemptRefresh('/auth/refresh', 401, false), false);
});
