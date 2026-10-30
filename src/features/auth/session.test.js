import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  SESSION_CACHE_KEY,
  toSessionUser,
  restoreSession,
  protectedRouteDecision,
  adminRouteDecision,
} from './session.js';

/**
 * Arma un `localStorage` mínimo con la entrada `currentUser` ya cacheada,
 * que es exactamente lo que un visitante puede manipular a mano.
 */
const createStorage = (cached) => {
  const store = new Map();
  if (cached !== undefined) {
    store.set(SESSION_CACHE_KEY, JSON.stringify(cached));
  }

  return {
    store,
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
};

const serverUser = {
  id: '507f1f77bcf86cd799439011',
  name: 'Ash',
  email: 'ash@poke.dev',
  role: 'admin',
};

// S19: el usuario del contexto se construye desde la respuesta del servidor.
test('S19 toSessionUser toma los campos del servidor y marca la sesión como válida', () => {
  const user = toSessionUser(serverUser);

  assert.deepEqual(user, {
    id: serverUser.id,
    name: 'Ash',
    email: 'ash@poke.dev',
    role: 'admin',
    loggedIn: true,
  });
});

test('S19 toSessionUser usa el prefijo del email cuando el servidor no tiene nombre', () => {
  const user = toSessionUser({ ...serverUser, name: null });

  assert.equal(user.name, 'ash');
});

// S19 + S20: la revalidación con /auth/me es la fuente de verdad de la sesión.
test('S19 restoreSession devuelve el usuario del servidor y conserva la caché', async () => {
  const storage = createStorage({ email: 'viejo@poke.dev', loggedIn: true });

  const result = await restoreSession({
    fetchCurrentUser: async () => serverUser,
    storage,
  });

  assert.equal(result.user.email, 'ash@poke.dev');
  assert.equal(result.clearedCache, false);
  assert.match(storage.getItem(SESSION_CACHE_KEY), /ash@poke\.dev/);
});

test('S20 restoreSession sin sesión válida deja user en null y borra la caché', async () => {
  const storage = createStorage({ email: 'ash@poke.dev', loggedIn: true });

  const result = await restoreSession({
    fetchCurrentUser: async () => {
      const error = new Error('Could not validate credentials');
      error.status = 401;
      throw error;
    },
    storage,
  });

  assert.equal(result.user, null);
  assert.equal(result.clearedCache, true);
  assert.equal(storage.getItem(SESSION_CACHE_KEY), null);
});

test('S24 restoreSession reintenta una vez antes de rendirse', async () => {
  const storage = createStorage({ email: 'viejo@poke.dev', loggedIn: true });
  let calls = 0;

  const result = await restoreSession({
    fetchCurrentUser: async () => {
      calls += 1;
      if (calls === 1) throw new TypeError('Failed to fetch');
      return serverUser;
    },
    storage,
  });

  assert.equal(calls, 2);
  assert.equal(result.user.email, 'ash@poke.dev');
});

test('S24 un fallo transitorio deja la sesión no verificada y conserva la caché', async () => {
  for (const failure of [new TypeError('Failed to fetch'), Object.assign(new Error('500'), { status: 500 })]) {
    const storage = createStorage({ email: 'ash@poke.dev', loggedIn: true });

    const result = await restoreSession({
      fetchCurrentUser: async () => {
        throw failure;
      },
      storage,
    });

    assert.equal(result.user, null);
    assert.equal(result.unavailable, true);
    assert.equal(result.clearedCache, false);
    assert.match(storage.getItem(SESSION_CACHE_KEY), /ash@poke\.dev/);
  }
});

test('S24 con la sesión no verificada la guardia pide reintentar, no cerrar sesión', () => {
  assert.equal(protectedRouteDecision(null, false, true), 'unavailable');
  assert.equal(adminRouteDecision(null, false, true), 'unavailable');
});

// S21: la caché manipulada a mano no abre la ruta protegida.
test('S21 una caché con loggedIn true y servidor sin sesión termina en /login', async () => {
  const storage = createStorage({ email: 'intruso@poke.dev', role: 'admin', loggedIn: true });

  const { user } = await restoreSession({
    fetchCurrentUser: async () => {
      const error = new Error('Not authenticated');
      error.status = 401;
      throw error;
    },
    storage,
  });

  assert.equal(protectedRouteDecision(user, false), 'login');
  assert.equal(adminRouteDecision(user, false), 'login');
});

test('S21 protectedRouteDecision con usuario del servidor deja pasar', () => {
  assert.equal(protectedRouteDecision(toSessionUser(serverUser), false), 'allow');
});

// S22: el rol que decide es el del servidor.
test('S22 adminRouteDecision deja pasar solo al rol admin', () => {
  assert.equal(adminRouteDecision(toSessionUser(serverUser), false), 'allow');
  assert.equal(
    adminRouteDecision(toSessionUser({ ...serverUser, role: 'user' }), false),
    'dashboard',
  );
});

// S23: durante la revalidación no se renderiza ni se redirige.
test('S23 mientras loading es true la guardia espera, con o sin usuario', () => {
  assert.equal(protectedRouteDecision(null, true), 'wait');
  assert.equal(protectedRouteDecision(toSessionUser(serverUser), true), 'wait');
  assert.equal(adminRouteDecision(null, true), 'wait');
  assert.equal(adminRouteDecision(toSessionUser(serverUser), true), 'wait');
});
