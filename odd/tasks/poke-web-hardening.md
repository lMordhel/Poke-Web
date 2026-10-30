# Poke-Web — Endurecimiento progresivo del e-commerce

Feature: cerrar los hallazgos del análisis de arquitectura, punto por punto, empezando por la integridad del dinero.
Estado: T1-T9, T3b y T3c cerrados; siguiente: T10.

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

S26. Ante un 401 en una petición normal, `apiClient` pide `POST /auth/refresh` una vez y, si funciona, reintenta la petición original exactamente una vez.

S27. Si el refresh falla, la petición termina con 401, se borra la caché local y el contexto queda sin usuario: logout limpio, sin bucles y sin una segunda llamada de red para cerrar la sesión.

S28. Las peticiones a `/auth/login`, `/auth/register`, `/auth/refresh` y `/auth/logout` nunca disparan un refresh.

S29. Un error distinto de 401 (400, 403, 500, red) no dispara refresh ni reintento.

S30. `backend/uploads/` no está en el índice de git: los archivos subidos en tiempo de ejecución existen solo en disco y la ruta está ignorada.

S31. `src/assets` solo contiene los archivos que la aplicación usa de verdad: el único asset local es el fondo de la portada (`fondo1`), en WebP con las mismas dimensiones que el PNG original. Las imágenes de producto salen de `image_url` / `images` en MongoDB, nunca de `src/assets`.

## Tasks

- T1 (S1-S7) — Precio y total autoritativos en el servidor. Rodaja: `backend/app/schemas/order.py`, `backend/app/services/pricing.py`, `backend/app/services/order_service.py`, `backend/app/repositories/order_repository.py`, `backend/tests/`. Commit: f85e129. Revisión nativa del bloque T1-T6: R3 (aprobada).
- T2 (S8) — Carrito envía datos mínimos y propaga el error real del backend. Commit: f85e129.
- T3 (S9-S10) — Índice único en `users.email` y `DuplicateKeyError` → 409. Commit: 0c1fc2a.
- T3c (S13) — `/auth/refresh` valida que el usuario exista y esté activo; si no, 401 + cookies borradas.
- T4 (S11-S12) — Claim `type` en JWT y verificación en `/auth/refresh`. Commit: 7279f84.
- T5 (S14-S15) — Sanear `long_description` en el servidor con allowlist (`nh3`), al escribir y al leer el detalle. Commit: 2fbde41.
- T3b (S16) — Diagnóstico accionable al crear el índice único si hay duplicados + script de reparación idempotente. Commit: 96a94fe.
- T6 (S17-S18) — Cookies `Secure` por entorno, CORS con lista explícita desde configuración, sin regex de `vercel.app`. Rodaja: `backend/app/core/config.py`, `backend/app/main.py`, `backend/app/api/v1/endpoints/auth.py`, `backend/tests/test_cors_policy.py`, `backend/tests/test_cookie_secure.py`, `backend/tests/test_refresh_active_user.py`. Commit: 3c69770.
- T7 (S19-S25) — `AuthProvider` revalida con `/auth/me`; `ProtectedRoute`/`AdminRoute` deciden desde el backend, no desde `localStorage`. Rodaja: `src/features/auth/session.js`, `src/features/auth/session.test.js`, `src/features/auth/auth.context.jsx`, `src/shared/components/ProtectedRoute.jsx`, `src/shared/components/AdminRoute.jsx`, `src/shared/components/SessionUnavailable.jsx`, `src/features/dashboard/components/DashboardLayout/DashboardLayout.jsx`, `package.json`. Commits: 5496710, b7f98f1.
- T8 (S26-S29) — Refresh real en `apiClient`: 401 → `/auth/refresh` → reintento único → logout limpio. Rodaja: `src/lib/request.js`, `src/lib/request.test.js`, `src/lib/axios.js`, `src/features/auth/auth.context.jsx`. Commit: 9fae16e.
- T9 (S30-S31) — `backend/uploads/` fuera del índice de git y assets recompirmidos a WebP. Rodaja: `.gitignore`, `src/assets/`. Commits: d51d454, b1f0da2.
- T10 — `.env.example` (raíz y backend) y alinear `VITE_API_BASE_URL` con la documentación.
- T11 — Ciclo de vida de pedidos en admin (`GET/PATCH /admin/orders`).
- T12 — Paginación real en catálogo/admin y búsqueda server-side.
- T13 — Borrar código muerto (`app/routers/`, `product.service.js` duplicado, `Header` duplicado, schemas sin uso). Rodaja inicial: `backend/app/routers/` borrado en 40781e8; faltan el `product.service.js` duplicado, el `Header` duplicado y los schemas sin uso.
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

L6 (2026-10-30, usuario, decisión): eligió «Seguir con T8 (refresh real en apiClient)» frente a la revisión nativa de la rama completa y frente a una pasada manual en navegador de T7. Efecto explícito: el candidato de rama `sha256:e99031613ce1ad1d663d97e2f44e0f4bae1c2de63304241c3306ac4b98a7f3ce` (base `13b7641` → `ff475e6`, T1-T7 acumulados) queda **sin revisar por decisión del usuario**, no por omisión del agente.

E9 (evidencia, T8): RED `npm run test` → `1 failed` con `src/lib/request.test.js` (el módulo `./request.js` todavía no existía). GREEN: `18 passed`, `npm run lint` exit 0, `npm run build` exit 0 (`✓ built in 4.76s`). Casos cubiertos: reintento único tras refresh correcto, refresh fallido sin reintento, reintento que vuelve a dar 401 sin segundo refresh, los cuatro endpoints de auth excluidos y 400/403/500 sin refresh.

E10 (revisión nativa de T8, lineage `review-96c7b12790511d90`, lentes risk/resilience/reliability): **aprobada** (`state: approved`, autoridad quemada en la aclaración exacta). Sin hallazgos bloqueantes. Quedan tres avisos informativos, explícitamente no bloqueantes y fuera de este candidato: `R3-001` y `R4-001` en `src/lib/request.js:39-46` (recursión del reintento) y `R3-002` en `src/lib/request.test.js:18-57` (helpers de prueba). Se atienden si T11/T12 vuelven a tocar `apiClient`.

E11 (evidencia, T9): 13 archivos de `backend/uploads/` sacados del índice con `git rm --cached` (siguen en disco) y `backend/uploads/` añadido a `.gitignore`. Assets: 8 PNG de ~5.9 MB convertidos con `ffmpeg -c:v libwebp -quality 82`; dimensiones verificadas con `ffprobe` (2816x1536; `fondo1` 2816x1504) e inspección visual de `charmanderpush.webp` sin artefactos. `src/assets` pasó de 47,2 MB a 1,52 MB. `bulbasaurpush.png` (5,9 MB) eliminado: el catálogo ya importaba su `.webp`. `npm run build` exit 0, `npm run lint` exit 0, `npm run test` 18 passed, y `rg "\.png" src` no deja ninguna referencia rota.

H1 (hallazgo fuera de alcance, durante T9): `backend/app/api/v1/endpoints/products.py:248` devuelve `image_url = f"http://localhost:8000/uploads/{secure_filename}"` con el origen hardcodeado. Debería salir de configuración; encaja en T10.

L7 (2026-10-30, usuario, verbatim): «pero esos se usan ? por que en moi base datos en mongo ya tengo los productos asi { … image_url: 'https://i.imgur.com/Li6hEAJ.jpeg', … }»

D5 (corrección de alcance de T9, confirmada por la revisión del usuario): los ocho peluches de `src/assets` **no se usan**. El único consumidor de `images.js` era `Home.jsx`, y solo leía `images.fondo1`; el catálogo pinta `product.img || product.image_url` desde Mongo. La conversión a WebP seguía teniendo valor (Vite empaquetaba los nueve archivos en `dist/`), pero el destino correcto era borrarlos, no optimizarlos. Se elimina `images.js`, `react.svg` (sin referencias) y los ocho peluches; `Home.jsx` importa `fondo1.webp` directamente. S31 se reescribe en consecuencia.

E12 (evidencia, corrección de T9): `dist/assets` pasó de nueve imágenes (1,5 MB) a una sola, `fondo1-CtyY-vjW.webp` (283 KB); `src/assets` queda en 283 KB. `rg -n "images\." src/features/home/pages/Home.jsx` ya no devuelve nada y `npm run build` / `npm run lint` / `npm run test` (18 passed) siguen en verde.

L8 (2026-10-30, usuario, decisión): «Revisar solo T1-T6 (lo nunca revisado)» — 2 lentes (risk, reliability), sin re-revisar T7/T8/T9.

E13 (revisión de backlog T1-T6, lineage `review-5a2f1d86b41f244d`, en worktree temporal `poke-web-t1t6-review` en `1fdbc4f`): 2 lentes + refuter ejecutados. El refuter bloqueó con **R3-001 CRITICAL**: `Cart.jsx:66-74` mostraba un texto fijo «Tu carrito cambió» en el 409 y se comía el `detail` real del servidor, violando S8. Corregido en `6459898`: ambos fallos del checkout usan `error.message` (que `apiClient` rellena desde `detail`). Diff: 6 líneas. `lint` exit 0, `test` 18 passed.

B1 (bloqueo de plataforma): la captura del plan de corrección (`review.capture-correction-plan`, `correctionLines: 6`) es rechazada por el facade con «collectBinding is missing or stale for current STATUS» de forma reproducible. Probado: binding re-leída inmediatamente antes, árbol quieto, objeto y string serializada, `--request-hash` antes y después de `--repository-context`, con y sin `workspaceRoot`, y **tras `gentle-ai sync`** (el linaje no reporta `managed_assets_outdated`, así que no era desajuste de assets). Seis intentos, siempre el mismo rechazo. El linaje queda en `correction_required` **sin autoridad quemada**; la corrección sí está en la rama. Opciones pendientes para el usuario: liberar la autoridad y revisar el candidato ya corregido desde cero, o dejar el linaje sin cerrar. Resuelto en R3 por la primera vía.

L9 (2026-10-30, usuario, verbatim): "a"

D6 (decisión, confirmada por L9): la autoridad de `review-5a2f1d86b41f244d` se libera con `abandon` (motivo `operator_disposition`) en lugar de reintentar la captura rechazada o dejar el linaje abierto; el candidato ya corregido se revisa de cero. La autoridad vieja no se puede reaprovechar y sus hallazgos quedan en cuarentena.

E14 (evidencia, B1 resuelto): `gentle_review abandon` devolvió `gentle-ai.review-reclaim-record/v1` con `status: committed`; lo descartado, según el propio proveedor, fue `{"captured_lens_results":["00-review-risk","01-review-reliability"],"findings_present":true}` y el registro quedó en `review-transactions/quarantine/review-5a2f1d86b41f244d-3787548307`. La causa raíz del rechazo de B1 no se diagnosticó: `inspect` no listaba ese linaje en ninguno de los dos `workspaceRoot` probados (`candidates: []`), así que el facade no podía reemitir su plan de corrección. Candidato nuevo revisado: en el worktree `poke-web-t1t6-review`, HEAD `490f8d7` (= `1fdbc4f` + el arreglo de `Cart.jsx`); el patch de ese arreglo es idéntico byte a byte al del commit `6459898` de la rama (sha256 del patch `3488CE57…5B49E87`), así que la revisión cubre exactamente el árbol corregido. START con `baseRef=13b7641`, `committedOnly=true`, lentes risk+reliability: 30 archivos, 2991 líneas, tier `high`, presupuesto de corrección 200.

R3 (revisión nativa del candidato corregido, lineage `review-4b0f5f0564b203fe`): revisores risk y reliability capturados y el refuter exigido por el proveedor. Cierra **`approved`** y la aclaración exacta quemó la autoridad (`burn_evidence: gentle-ai.review-acknowledged/v1`). Ningún hallazgo bloqueante, ninguna transición de corrección ofrecida. Avisos informativos, que son trabajo posterior y nunca motivo para repetir la revisión de este candidato: `R1-001` WARNING en `backend/app/core/migrations.py:197-202`; `R3-001` CRITICAL en `backend/app/core/migrations.py:132` **refutado** por el refuter; `R3-002` WARNING en `backend/app/services/pricing.py:43`; `R3-003` WARNING en `backend/app/services/pricing.py:51`.
