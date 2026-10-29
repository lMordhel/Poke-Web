# Poke-Web — Endurecimiento progresivo del e-commerce

Feature: cerrar los hallazgos del análisis de arquitectura, punto por punto, empezando por la integridad del dinero.
Estado: T1 en curso.

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

S13. (pendiente) `POST /auth/refresh` solo emite tokens para un usuario existente y activo; hoy un refresh token de una cuenta borrada sigue acuñando access tokens.

S14. `long_description` se guarda saneado con una allowlist de HTML (sin `<script>`, sin atributos de evento tipo `onerror`, sin URLs `javascript:`), tanto al crear como al actualizar un producto.

S15. Al leer el detalle de un producto, el `long_description` devuelto ya viene saneado, de modo que los registros antiguos con HTML sucio tampoco llegan al cliente.

S16. Si la base ya tiene emails duplicados, el arranque falla con un mensaje accionable (cuántos duplicados y qué ejecutar) y existe un script de reparación idempotente.

## Tasks

- T1 (S1-S7) — Precio y total autoritativos en el servidor. Rodaja: `backend/app/schemas/order.py`, `backend/app/services/pricing.py`, `backend/app/services/order_service.py`, `backend/app/repositories/order_repository.py`, `backend/tests/`. Commit: f85e129.
- T2 (S8) — Carrito envía datos mínimos y propaga el error real del backend. Commit: f85e129.
- T3 (S9-S10) — Índice único en `users.email` y `DuplicateKeyError` → 409. Commit: 0c1fc2a.
- T3b (S13, decisión pendiente) — Qué hacer si la base ya tiene emails duplicados: `create_index(unique=True)` falla al arrancar y la API no levanta. Opciones: script de limpieza previo documentado, o degradar con log explícito.
- T4 (S11-S12) — Claim `type` en JWT y verificación en `/auth/refresh`. Commit: 7279f84.
- T5 (S14-S15) — Sanear `long_description` en el servidor con allowlist (`nh3`), al escribir y al leer el detalle. Commit: 2fbde41.
- T3b (S16) — Diagnóstico accionable al crear el índice único si hay duplicados + script de reparación idempotente. Commit: 96a94fe.
- T6 — Cookies `secure` por entorno, CORS con lista explícita, quitar regex `vercel.app`.
- T7 — `AuthProvider` revalida con `/auth/me`; `ProtectedRoute`/`AdminRoute` dependen del backend, no de `localStorage`.
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

L3 (hallazgo P0 durante T1, verbatim del entorno): `RuntimeError: Form data requires "python-multipart" to be installed.` — `backend/requirements.txt` no incluía `python-multipart` y `products.py` usa `File(...)`, así que una instalación limpia no podía importar la app. Corregido en el mismo commit.
