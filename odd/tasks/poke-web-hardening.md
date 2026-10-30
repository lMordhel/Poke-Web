# Poke-Web — Endurecimiento progresivo del e-commerce

Feature: cerrar los hallazgos del análisis de arquitectura, punto por punto, empezando por la integridad del dinero.
Estado: T1-T7, T3b y T3c cerrados; siguiente: T8.

## Specs

S1. El servidor no confía en `price`, `name`, `type`, `img` ni `total` enviados por el cliente: recalcula precio y total desde MongoDB antes de crear el pedido.

S2. Si el `total` declarado por el cliente difiere del total calculado por el servidor, el pedido se rechaza con 409 y no se escribe nada: ni pedido, ni cambio de stock, ni `sold_count`.

S3. Un producto inexistente, o una talla/variante inexistente para ese producto, se rechaza con 409 y no produce escrituras.

S4. Stock insuficiente para un ítem o variante se rechaza con 409 y no produce pedido (comportamiento actual preservado).

S5. Un pedido válido responde 201 con `status: "pending"`, `total` igual al calculado por el servidor, y el stock descontado.

S6. Un carrito vacío responde 400 (comportamiento actual preservado).

S7. `POST /api/v1/orders/` sigue requiriendo usuario autenticado (comportamiento actual preservado).

S8. El frontend envía `id`, `quantity` y `size` de cada ítem; muestra el `detail` real del servidor cuando el checkout falla, en lugar de un mensaje genérico.

S9. `users.email` tiene un índice único en MongoDB, creado al arrancar la aplicación.

S10. Registrar un email ya existente responde 409 con `detail: "Email already exists"`, incluso si dos peticiones concurrentes pasan la verificación previa, y no crea un segundo usuario.

S11. Todo JWT emitido lleva un claim `type` con valor `access` o `refresh`.

S12. `POST /auth/refresh` responde 401 si el token presentado no es de tipo `refresh`, y no emite cookies nuevas en ese caso.

S13. `POST /auth/refresh` responde 401 y no emite cookies nuevas cuando el usuario del token ya no existe o está inactivo; en ese caso además borra las cookies `access_token`/`refresh_token` presentes.

S14. `long_description` se guarda saneado con una allowlist de HTML (sin `<script>`, sin atributos de evento tipo `onerror`, sin URLs `javascript:`), tanto al crear como al actualizar un producto.

S15. Al leer el detalle de un producto, el `long_description` devuelto ya viene saneado, de modo que los registros antiguos con HTML sucio tampoco llegan al cliente.

S16. Si la base ya tiene emails duplicados, el arranque falla con un mensaje accionable (cuántos duplicados y qué ejecutar) y existe un script de reparación idempotente.

S17. La lista de orígenes CORS permitidos se declara explícitamente en configuración (`CORS_ORIGINS`); no existe ningún comodín por patrón: un origen como `https://cualquier-cosa.vercel.app` que no esté en la lista no recibe cabecera `Access-Control-Allow-Origin`.

S18. Las cookies `access_token` y `refresh_token` se emiten `HttpOnly` y `SameSite=Lax` siempre, y con `Secure` únicamente cuando `ENVIRONMENT=production`; en el entorno local por defecto (`ENVIRONMENT=local`) van sin `Secure` para que funcionen sobre `http://localhost`.

S19. `AuthProvider` no usa `localStorage` como fuente de verdad: al montar consulta `GET /auth/me` y construye el usuario desde esa respuesta.

S20. Si `GET /auth/me` responde 401 o 403, el contexto queda sin usuario y la entrada `currentUser` de `localStorage` se borra.

S21. `ProtectedRoute` redirige a `/login` cuando el contexto no tiene usuario, aunque `localStorage.currentUser` exista y diga `loggedIn: true`.

S22. `AdminRoute` deja pasar solo si el rol del servidor es `admin`; autenticado sin rol admin va a `/dashboard`, sin sesión va a `/login`.

S23. Mientras la revalidación está en curso, `ProtectedRoute` y `AdminRoute` no renderizan el contenido protegido ni redirigen.

S24. Si `GET /auth/me` falla por una causa transitoria (error de red o 5xx), la sesión no se destruye: se reintenta una vez, la caché se conserva y la aplicación muestra un estado de sesión no verificada con reintento manual, sin redirigir a `/login` y sin abrir la ruta protegida.

S25. Un 401 durante la carga del panel cierra la sesión (el contexto queda sin usuario y el guardia redirige a `/login`), en lugar de registrarse solo en consola.

## Tasks

- T1 (S1-S7) — Precio y total autoritativos en el servidor. Rodaja: `backend/app/schemas/order.py`, `backend/app/services/pricing.py`, `backend/app/services/order_service.py`, `backend/app/repositories/order_repository.py`, `backend/tests/`. Commit: f85e129.
- T2 (S8) — Carrito envía datos mínimos y propaga el error real del backend. Commit: f85e129.
- T3 (S9-S10) — Índice único en `users.email` y `DuplicateKeyError` → 409. Commit: 0c1fc2a.
- T3c (S13) — `/auth/refresh` valida que el usuario exista y esté activo; si no, 401 + cookies borradas.
- T4 (S11-S12) — Claim `type` en JWT y verificación en `/auth/refresh`. Commit: 7279f84.
- T5 (S14-S15) — Sanear `long_description` en el servidor con allowlist (`nh3`), al escribir y al leer el detalle. Commit: 2fbde41.
- T3b (S16) — Diagnóstico accionable al crear el índice único si hay duplicados + script de reparación idempotente. Commit: 96a94fe.
- T6 (S17-S18) — Cookies `Secure` por entorno, CORS con lista explícita desde configuración, sin regex de `vercel.app`. Rodaja: `backend/app/core/config.py`, `backend/app/main.py`, `backend/app/api/v1/endpoints/auth.py`, `backend/tests/test_cors_policy.py`, `backend/tests/test_cookie_secure.py`, `backend/tests/test_refresh_active_user.py`. Commit: 3c69770.
- T7 (S19-S25) — `AuthProvider` revalida con `/auth/me`; `ProtectedRoute`/`AdminRoute` deciden desde el backend, no desde `localStorage`. Rodaja: `src/features/auth/session.js`, `src/features/auth/session.test.js`, `src/features/auth/auth.context.jsx`, `src/shared/components/ProtectedRoute.jsx`, `src/shared/components/AdminRoute.jsx`, `src/shared/components/SessionUnavailable.jsx`, `src/features/dashboard/components/DashboardLayout/DashboardLayout.jsx`, `package.json`. Commits: 5496710, b7f98f1.
- T8 — Refresh real en `apiClient` (401 → refresh → reintento → logout limpio).
- T9 — Sacar `backend/uploads/` del índice de git y recomprimir `src/assets` a WebP.
- T10 — `.env.example` (raíz y backend) y alinear `VITE_API_BASE_URL` con la documentación.
- T11 — Ciclo de vida de pedidos en admin (`GET/PATCH /admin/orders`).
- T12 — Paginación real en catálogo/admin y búsqueda server-side.
- T13 — Borrar código muerto (`app/routers/`, `product.service.js` duplicado, `Header` duplicado, schemas sin uso).
- T14 — ErrorBoundary + ruta `*` (404) + arreglar `varsIgnorePattern` de ESLint.
- T15 — CI (lint + build + tests) y `pre-commit`.

## Log

L1 (2026-01-01, usuario, verbatim): "analiza este proyecto , fue armado a punta de promt no se uso ninguna metodologia , analiza a profundidad elñ front y el back , no investes nada , si tienesx duda vuelve a revisar sn que se te pase algo , y dame un feedbac"

L2 (usuario, verbatim): "vamos punto por punto hasta lograr arreglar el productos , necesitas alguna skill para inatalrte ? o asi esta bien ?"

D1 (asistente, decisión, confirmable): total falseado → 409 con cero escrituras; se instala `.venv` del backend para poder observar RED→GREEN. Ambas reversibles.

E1 (evidencia, T1-T2): RED observado (10 fallos, `TypeError: OrderService.__init__() got an unexpected keyword argument 'order_repo'`). GREEN: `13 passed`. Frontend: `npm run lint` exit 0, `npm run build` exit 0. Backend: `import app.main` OK.

E2 (evidencia, T3): RED verificado por el orquestador revirtiendo la implementación con `git stash`:
- S9 → `ImportError: cannot import name 'create_indexes' from 'app.main'`.
- S10 → `2 failed`: `pymongo.errors.DuplicateKeyError` sin manejar (sería 500).
GREEN con implementación restaurada: `20 passed`. Backend: `import app.main` OK.
Nota: el worker delegado no pudo ejecutar tests (runner bash/WSL roto en ese momento); escribió código y tests, la verificación completa la hizo el orquestador.

E3 (evidencia, T4): RED `ImportError: cannot import name 'ACCESS_TOKEN_TYPE' from 'app.core.security'`. GREEN: `26 passed`. Backend: `import app.main` OK.

E4 (evidencia, T5): RED `ModuleNotFoundError: No module named 'app.core.sanitize'` (verificado con `git stash push -u`). GREEN: `53 passed`. Smoke del saneador: `<script>alert(1)</script><img src=x onerror=alert(1)>` → `<p>x</p>`; `href="javascript:..."` → `<a>click</a>`; `style`/`data-*`/`onclick` eliminados. Se corrigió un `ValueError` de nh3: `rel` no puede estar en `attributes` cuando `link_rel` está activo (nh3 lo inyecta solo).

E5 (evidencia, T3b): RED `ModuleNotFoundError: No module named 'app.core.migrations'`. GREEN: `65 passed`. Smoke: `plan_email_dedupe` conserva la cuenta más antigua y marca la nueva para borrar; `python -m scripts.dedupe_emails --help` funciona sin `JWT_SECRET`; el mensaje de arranque imprime el comando exacto de reparación.

E6 (evidencia, T6): el commit 3c69770 contiene los tres specs (`test_cors_policy.py`, `test_cookie_secure.py`, `test_refresh_active_user.py`) junto con la implementación. GREEN verificado por el orquestador sobre el árbol actual: `python -m pytest -q` en `backend/` → `79 passed` (3.74s). No se registró aquí el RED de T6, ejecutado en la sesión anterior; el árbol actual no permite reconstruirlo sin revertir el commit.

E7 (evidencia, T7): RED `MODULE_NOT_FOUND` al correr `node --test "src/**/*.test.js"` sobre `session.test.js` antes de existir `session.js`. GREEN: `9 passed` (decisiones de sesión y guardias), `npm run lint` exit 0, `npm run build` exit 0 (`✓ built in 10.96s`). Verificación proporcional al no existir runner de DOM: la lógica de decisión se extrajo a un módulo puro y los componentes son envoltorios triviales. No se hizo comprobación en navegador contra el backend real (requiere Mongo y API levantados), queda para una pasada manual.

C1 (chore, 4ab0c24): `.pi/` (config local de subagentes) entró en `.gitignore`; al estar sin trackear, `gentle_review assess` no podía evaluar ningún candidato del repo.

R1 (revisión nativa, lineage `review-cbd83986b4bbbd86`, lentes risk/resilience/reliability + refuter): dos hallazgos CRITICAL atribuidos al candidato, ambos aceptados y corregidos en b7f98f1. R3-001: el `catch` del panel ya no cerraba la sesión ante un 401. R4-001: `restoreSession` trataba cualquier fallo de `/auth/me` como sesión inexistente, expulsando a un usuario válido ante un corte de red o un 5xx.

L5 (usuario, verbatim de la revisión): «The new catch path only logs dashboard data-load errors; it no longer clears the token or redirects to /login as the baseline did.» y «restoreSession collapses every failure of the current-user request (5xx, offline/DNS failure, timeout, malformed 2xx body) into 'no session'».

D4 (decisión, corrección): solo 401/403 destruyen la sesión; red/5xx se reintenta una vez y deja la sesión «no verificada» con la caché intacta y pantalla de reintento. El 401 tardío del panel llama a `revalidate()`. Reescribe S20, añade S24 y S25.

E8 (evidencia, corrección R1, commit b7f98f1): tests primero y en rojo (`npm run test` → `1 failed`, el módulo aún no exponía el nuevo contrato). GREEN: `11 passed`, incluidos reintento, fallo transitorio (red y 500), caché intacta y decisión «unavailable». `npm run lint` exit 0, `npm run build` exit 0. Diff de la corrección: 190 líneas.

R2 (revisión nativa del candidato corregido, lineage `review-2504fbf8d0a1fbf7` vía `recover` con disposición `scope_changed`): cierra en estado `escalated` por causalidad desconocida en los hallazgos `R3-revalidate-wait` y `R3-session-race`. Según el contrato del proveedor es informativo: no bloquea, pero queda como seguimiento manual para T8 (el refresh real en `apiClient` toca la misma ruta de `revalidate`).

L4 (2026-10-29, usuario, verbatim): "(t6)si bien aparece que esta en produccion pero esta caido no tiene funcinalidad por ahora solo trabajaremos en local, (s13)haz tu recomendacion"

D2 (asistente, decisión, confirmable): el proyecto solo se usa en local por ahora, así que la lista CORS por defecto queda en los orígenes de localhost y se gestiona con `CORS_ORIGINS`; se elimina el regex `*.vercel.app` y no se inventan dominios de producción. `Secure` de las cookies se deriva de `ENVIRONMENT` (`local` por defecto → `Secure=false`; `production` → `Secure=true`). Reversible: cambiar dos variables de entorno.

D3 (asistente, decisión, confirmada por el usuario): un refresh token de una cuenta borrada o inactiva responde 401 `"Invalid refresh token"` y borra ambas cookies; no se mantiene la sesión hasta el `exp` del refresh.

L3 (hallazgo P0 durante T1, verbatim del entorno): `RuntimeError: Form data requires "python-multipart" to be installed.` — `backend/requirements.txt` no incluía `python-multipart` y `products.py` usa `File(...)`, así que una instalación limpia no podía importar la app. Corregido en el mismo commit.
