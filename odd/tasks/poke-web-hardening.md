# Poke-Web — Endurecimiento progresivo del e-commerce

Feature: cerrar los hallazgos del análisis de arquitectura, punto por punto, empezando por la integridad del dinero.
Estado: T1-T11, T3b y T3c cerrados, integrados en `master` y publicados en `origin/master`; siguiente: T12.

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

S32. Existe un `.env.example` en la raíz y otro en `backend/` que declaran, sin secretos reales, todas las variables que el código lee: `VITE_API_BASE_URL` en el frontend; `MONGO_URI`, `MONGO_DB`, `JWT_SECRET`, `ENVIRONMENT`, `CORS_ORIGINS`, `PUBLIC_BASE_URL` y las expiraciones de token en el backend.

S33. La documentación usa el nombre real de la variable del frontend, `VITE_API_BASE_URL`, con el valor que el código necesita: la base de la API incluido el prefijo `/api/v1` (por ejemplo `http://localhost:8000/api/v1`). No se documenta una variable con otro nombre.

S34. La URL absoluta que `POST /products/upload-image` devuelve para una imagen subida se construye a partir de configuración (`PUBLIC_BASE_URL`, por defecto `http://localhost:8000`), sin origen hardcodeado en el código, y una barra final en la base no produce `//uploads`.

S35. `GET /api/v1/admin/orders` exige rol `admin`: sin credenciales responde 401, y con sesión sin rol admin responde 403. Devuelve como máximo 100 pedidos, los más recientes primero.

S36. `PATCH /api/v1/admin/orders/{order_id}` exige rol `admin` y acepta un único campo `status`, cuyo valor debe ser uno de `pending`, `processing`, `shipped`, `delivered` o `cancelled`. Cualquier otro valor responde 422 y no escribe nada.

S37. Las transiciones permitidas son `pending → processing`, `pending → cancelled`, `processing → shipped`, `processing → cancelled`, `shipped → delivered` y `shipped → cancelled`. `delivered` y `cancelled` son terminales. Cualquier otra transición —incluida la del estado al mismo estado— responde 409 y no escribe nada.

S38. Un `order_id` inexistente, o que no es un ObjectId válido, responde 404 y no escribe nada.

S39. Un `PATCH` a `cancelled` devuelve al inventario la cantidad de cada ítem (a la talla/variante del ítem cuando la declara, al `stock` del producto cuando no) y descuenta la misma cantidad de `sold_count`; el estado del pedido queda `cancelled`.

S40. Cancelar dos veces el mismo pedido no devuelve stock dos veces: la segunda petición responde 409 y el inventario queda igual que tras la primera. Lo mismo vale para dos administradores en carrera: si el estado cambió entre la lectura y la escritura, la segunda petición responde 409, no cambia el estado y no devuelve stock.

S41. Una respuesta exitosa de `PATCH` devuelve el pedido completo con el estado nuevo, conservando ítems, `total`, `user_id` y `created_at`; los pedidos con estado distinto de `cancelled` no tocan el inventario.

S42. Si el producto de un ítem ya no existe, la cancelación se completa igual: el pedido queda `cancelled` y se omite la devolución de ese ítem.

S43. Cancelar nunca devuelve stock dos veces. Si la devolución falla para algún ítem —una talla que ya no existe en un producto que sí sigue, un identificador inválido o un error de escritura—, el pedido queda `cancelled`, los ítems que sí se pudieron devolver se devuelven, y la petición responde 500 indicando el pedido y cuántos ítems hay que corregir a mano. El estado no se revierte, para que un reintento no duplique la devolución.

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
- T9 (S30-S31) — `backend/uploads/` fuera del índice de git y assets recompirmidos a WebP. Rodaja: `.gitignore`, `src/assets/`. Commits: d51d454, b1f0da2. Revisión nativa: R4 (aprobada).
- T10 (S32-S34) — `.env.example` en raíz y `backend/`, documentación alineada con `VITE_API_BASE_URL` (incluye `/api/v1`) y origen público de las imágenes subidas desde configuración (H1). Rodaja: `backend/app/core/config.py`, `backend/app/api/v1/endpoints/products.py`, `backend/tests/test_upload_public_url.py`, `.env.example`, `backend/.env.example`, `README.md`, `backend/README.md`.
- T11 (S35-S43) — Ciclo de vida de pedidos en admin: `GET /admin/orders` y `PATCH /admin/orders/{id}` con tabla de transiciones y devolución de stock al cancelar. Rodaja: `backend/app/api/v1/endpoints/admin.py`, `backend/app/services/admin_order_service.py`, `backend/app/services/order_status.py`, `backend/app/repositories/order_repository.py`, `backend/app/schemas/order.py`, `backend/tests/test_order_lifecycle.py`. Alcance acordado (L13): solo API, sin pantalla de administración. Commits: 6f5709b, endurecimiento posterior tras verificación independiente (S43).
- T12 — Paginación real en catálogo/admin y búsqueda server-side.
- T13 — Borrar código muerto (`app/routers/`, `product.service.js` duplicado, `Header` duplicado, schemas sin uso). Rodaja inicial: `backend/app/routers/` borrado en 40781e8; faltan el `product.service.js` duplicado, el `Header` duplicado y los schemas sin uso. Revisión nativa de esa rodaja: R4 (aprobada).
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

L10 (2026-10-30, usuario, verbatim de la opción elegida): "Revisar solo el resto no revisado (T9 + app/routers)"

D7 (decisión, confirmada por L10): el candidato de rama completa que ofrecía `inspect` (target `sha256:ece87dcbd21cdf32d4ed03590ef802dcd1e74879b379e6048a4b588a58ad78ba`, base `13b7641`, 72 archivos, 3606+/492−) **no** se revisa: contradice la regla de que el candidato sea una rodaja y repetiría T1–T8 ya aprobados en R1, R2, R3 y E10. Se revisa en su lugar la rodaja nunca revisada `9fae16e..b2acc4d`.

E15 (evidencia, rodaja del resto): START con `baseRef=9fae16e` y `committedOnly=true`. La selección explícita de dos lentes (readability, reliability) fue rechazada con `native-start-input-invalid` / `lenses-invalid` y `lineage_created: false`; al reintentar sin lentes el proveedor fijó el tier en `high` por `backend/app/routers/auth.py` (un archivo **borrado** que contiene auth) y eligió las cuatro lentes por su cuenta. Linaje `review-a0346c2deec5e033`: 34 archivos, 360 líneas cambiadas, presupuesto de corrección 180. Nota: el diff real de la rodaja es 58+/302−; el resto hasta 360 son los binarios contados por el proveedor.

R4 (revisión nativa de la rodaja, lineage `review-a0346c2deec5e033`): cuatro revisores capturados, cierra **`approved`** en el último evento admitido, sin refuter (ningún hallazgo severo abrió corrección) y autoridad quemada con la aclaración exacta. Un solo aviso no bloqueante: `R3-001` SUGGESTION en `src/features/cart/pages/Cart.jsx:73`.

D8 (asistente, nota de plataforma): el tier `high` de R4 no viene del riesgo del cambio sino de que el nombre del archivo borrado contiene `auth`; el costo fueron cuatro ejecuciones de modelo (~62 KB de prompt cada una) para una rodaja de borrados. Lección para próximas rodajas de limpieza: acotar el rango para que el borrado de archivos con «auth» en el nombre no arrastre el tier, o aceptar el costo sabiéndolo.

L11 (2026-10-31, usuario, verbatim): "haz merge si se psude y pushea y aprte explicame por que hay  D:\Proyectos\poke-web-t1t6-review"

D9 (asistente, decisión, confirmada por L11): la rama `fix/order-price-authority` se integra a `master` por fast-forward (26 commits, 0 detrás) y se publica en `origin/master`. No se abre PR: el remoto solo tiene `master` y el usuario pidió merge directo. Reversible con `git reset --hard 13b7641` + push forzado, que el usuario tendría que autorizar.

E16 (evidencia, integración a master): antes del merge, verificación completa sobre el árbol entregado — backend `79 passed` (`.venv`, 5,27 s) y frontend `18 passed`. Merge `--ff-only` `13b7641..1247172`: 72 archivos, 3616+/492−. Push: `13b7641..1247172  master -> master`. Estado posterior: `origin/master...HEAD` = `0 0`, árbol limpio. Se ejecutó `git worktree prune -v`, que retiró cinco registros huérfanos: cuatro `candidate-views` de revisión y `poke-web-t1t6-review`; todos apuntaban al `gitdir` viejo de `D:\Nueva carpeta\Proyectos\Poke-Web`, porque el repositorio se movió a `D:\Proyectos\Poke-Web`. El directorio `D:\Proyectos\poke-web-t1t6-review` (124 MB: 70,8 backend, 46,8 src, 6,4 .agents) sigue en disco, ya sin registro en git, pendiente de que el usuario decida borrarlo.
E17 (evidencia, limpieza autorizada): el usuario aprobó borrar el worktree huérfano. Antes de borrar se comprobó que no hubiera trabajo único: ningún archivo fuera de `node_modules`/`.venv`/`__pycache__` tenía fecha de modificación posterior al 2026-10-30, es decir, nadie escribió nada ahí desde la revisión R3. `D:\Proyectos\poke-web-t1t6-review` (124,1 MB) se envió a la Papelera de reciclaje (reversible) en lugar de borrarse de forma permanente. `git worktree list` queda con una sola entrada y el árbol de `master` sigue limpio.

L12 (2026-10-31, usuario, verbatim): "si dale"

D10 (asistente, decisión, confirmada por L12): el origen de las imágenes subidas sale de `PUBLIC_BASE_URL` (por defecto `http://localhost:8000`), expuesto como `Settings.upload_url(filename)`, que normaliza una barra final. Se descartó devolver una URL relativa porque la imagen se guarda en Mongo y el catálogo la pinta tal cual (`product.img || product.image_url`). Los `.env.example` son plantillas con placeholders: nunca llevan secretos reales, y por eso se pueden versionar.

B2 (bloqueo de plataforma, resuelto por el usuario): la política de seguridad del harness rechazó escribir cualquier ruta con patrón dotenv (`D:\Proyectos\Poke-Web\.env.example` y `backend\.env.example`) incluso sin secretos dentro. El usuario autorizó explícitamente crearlas con la shell; `git check-ignore` confirma que no están ignoradas por `.gitignore` y quedan versionadas.

E18 (evidencia, T10): RED `pytest tests/test_upload_public_url.py` → 4 failed (`Extra inputs are not permitted [public_base_url]` y `Settings ... has no attribute 'public_base_url'`). GREEN: 4 passed, suite de backend `83 passed`. Frontend sin cambios de código: `npm test` 18 passed, `npm run lint` exit 0, `npm run build` exit 0 (5,58 s). Commits: 1f0234f (S34, código + test), b9c109c (S32-S33, plantillas y documentación).

L13 (2026-10-31, usuario, verbatim de las dos opciones elegidas): "Devolver stock al cancelar (recomendado)" y "Solo la API (recomendado)".

D11 (asistente, decisión, confirmada por L13): el vocabulario de estados no se inventa, sale del UI que ya existe (`OrdersSection.jsx`): `pending`, `processing`, `shipped`, `delivered`, `cancelled`. La tabla queda `pending → processing|cancelled`, `processing → shipped|cancelled`, `shipped → delivered|cancelled`; `delivered` y `cancelled` son terminales y el mismo estado no es una transición. El cambio de estado es un `update_one` condicionado al estado leído, así que dos administradores en carrera no devuelven stock dos veces. Un producto borrado no bloquea la cancelación: se omite su devolución y se registra. T11 se entrega solo como API, sin pantalla de administración.

E19 (evidencia, T11): RED de partida: `ImportError: cannot import name 'OrderStatusUpdate'` (la suite ni colectaba). GREEN: `22 passed` en `tests/test_order_lifecycle.py` y `105 passed` en la suite completa; frontend sin cambios de código (`npm test` 18 passed, `npm run lint` exit 0, `npm run build` exit 0). Prueba de mutación del guardia de carrera: con `{"_id": ..., "status": expected_status}` reducido a `{"_id": ...}`, falla `test_una_carrera_al_cancelar_no_devuelve_el_stock_ni_cambia_el_estado`; con el filtro real, verde. La primera versión de la prueba de doble cancelación secuencial no detectaba esa mutación (el 409 lo producía antes `ensure_transition`), y por eso se añadió el escenario de lectura obsoleta. Smoke contra `app.main`: `GET /api/v1/admin/orders` y `PATCH /api/v1/admin/orders/{id}` responden 401 sin sesión, es decir, las rutas están montadas. Lección: en FastAPI 0.162 `app.routes` no lista las rutas incluidas por `include_router`, así que la comprobación de montaje se hace con una petición real, no inspeccionando `app.routes`. Commit: 6f5709b.

D12 (asistente, decisión a partir de la verificación independiente): cancelar no revierte el estado nunca. Si la devolución falla para algún ítem —talla borrada de un producto que sí existe, id inválido o error de escritura—, el pedido queda `cancelled`, se devuelven los ítems que sí se pudieron y la petición responde 500 nombrando el pedido y cuántos ítems corregir a mano. Revertir el estado permitiría que un reintento devolviera dos veces el stock de los ítems que ya se restauraron, que es peor que un inventario bajo y localizado. Añade S43.

E20 (evidencia, verificación independiente y endurecimiento): el verificador independiente (`gentle-ai-verify`) dio PASS en S35-S42 con evidencia por archivo:línea y **ningún hallazgo bloqueante**. Reprodujo por su cuenta 14 sondas y dos mutaciones: quitar `"status": expected_status` del `update_one` y mover la devolución antes del flip; ambas hacen fallar la prueba de carrera. Observaciones no bloqueantes que quedan registradas: (1) `OrderStatusUpdate` ignora campos desconocidos del cuerpo (Pydantic `extra='ignore'`), así que `PATCH {"status":"processing","total":1}` responde 200; (2) la cancelación no es atómica (flip y devolución en dos pasos); (3) una variante borrada se saltaba en silencio; (4) huecos de test: 403 solo probado en la dependencia, no por HTTP; el tope de 100 solo vía `list_orders(limit=2)`; convivencia de `variants` con `stock` legacy sin cubrir. Se corrigió (3) y se cerraron los huecos (4) salvo el tope de 100 y el 403 por HTTP. RED del arreglo: `2 failed` con `DID NOT RAISE HTTPException`; GREEN: `109 passed` (4 tests nuevos). Commit: 05e668a. Sigue abierto, como trabajo futuro y no como defecto de este candidato: prohibir campos extra en `OrderStatusUpdate` y hacer atómica la cancelación (o compensarla) con una prueba que inyecte un fallo de devolución.

E21 (evidencia, cierre del hueco de S43): segunda verificación independiente del endurecimiento (rango `1e4a284..05e668a`): PASS en S39, S40, S42 y S43, sin hallazgos bloqueantes, `109 passed` reproducidos por el verificador. Confirmó que el `find_one` del repositorio es lo que separa «producto borrado» (200, S42) de «variante borrada» (500, S43), que un reintento tras el 500 responde 409 sin volver a tocar el inventario, y que la guardia de carrera sigue siendo la única. Señaló que la cláusula «error de escritura» de S43 no tenía test comprometido; se añadió `test_un_error_de_escritura_responde_500_y_no_frena_a_los_demas` (RED sobre el código anterior, porque la cancelación no fallaba). Suite: `110 passed`. Observaciones no bloqueantes que quedan registradas y sin arreglar: el log de ítems fallidos filtra por id de producto, así que con dos ítems del mismo producto puede nombrar también el que sí se devolvió (el conteo del detalle sí es correcto); y `missing` se deduce por resta en vez de medirse.

C2 (chore, 27c7866): el worktree tenía 161 archivos modificados con 0 sin trackear, pero `git diff --ignore-cr-at-eol` y `git diff -w` estaban vacíos: era CRLF puro sobre un índice en LF, y sin `.gitattributes` el próximo commit de T12 habría metido 24382 líneas fantasma. Pre-vuelo antes de descartar: 0 cambios reales ignorando CR, 0 ignorando todo whitespace, 0 untracked y 0 archivos `.bat`/`.cmd`/`.ps1` que requirieran CRLF. `git checkout -- .` restauró LF y se añadió `.gitattributes` con `* text=auto eol=lf`. Verificación: 167 archivos texto en `i/lf w/lf`, los 13 binarios (12 PNG y `fondo1.webp`) siguen `i/-text w/-text`, y `git add --renormalize .` no cambió ningún archivo, así que la política no introduce ruido. Los `\r` detectados en el árbol son bytes propios de esos binarios, no fin de línea de texto.
