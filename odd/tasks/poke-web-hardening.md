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

## Tasks

- T1 (S1-S7) — Precio y total autoritativos en el servidor. Rodaja: `backend/app/schemas/order.py`, `backend/app/services/order_service.py`, `backend/app/repositories/order_repository.py`, tests. Commit: pendiente.
- T2 (S8) — Carrito envía datos mínimos y propaga el error real del backend. Commit: pendiente.
- T3 — Índice único en `users.email` + manejo de `DuplicateKeyError` (S: registro duplicado → 409).
- T4 — Claim `type` (access/refresh) en JWT y verificación en `/refresh`.
- T5 — Sanear `long_description` o dejar de renderizar HTML crudo en `ProductDetail`.
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
