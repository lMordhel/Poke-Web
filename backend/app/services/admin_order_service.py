"""Ciclo de vida de pedidos para el panel de administración (S35-S42).

El administrador puede ver todos los pedidos y avanzar su estado. Avanzar no
toca el inventario; cancelar sí: devuelve exactamente lo que el checkout
descontó, y solo una vez (el cambio de estado es condicional, ver
`OrderRepository.set_status_if_current`).
"""

import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status

from app.repositories.order_repository import OrderRepository
from app.schemas.order import OrderOut
from app.services.order_status import OrderStatusError, ensure_transition

logger = logging.getLogger("api.admin.orders")


def _to_order_out(document: dict) -> OrderOut:
    """Convierte un documento de Mongo en la respuesta pública del pedido."""
    doc = dict(document)
    return OrderOut(id=str(doc.pop("_id")), **doc)


class AdminOrderService:
    def __init__(self, order_repo: Optional[OrderRepository] = None):
        # Inyectable para poder probar las reglas sin MongoDB.
        self.order_repo = order_repo if order_repo is not None else OrderRepository()

    async def list_orders(self, limit: int = 100) -> List[OrderOut]:
        documents = await self.order_repo.list_all(limit=limit)
        return [_to_order_out(document) for document in documents]

    async def update_status(self, order_id: str, new_status: str) -> OrderOut:
        order = await self.order_repo.get_by_id(order_id)
        if order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
            )

        current_status = order.get("status", "")
        try:
            ensure_transition(current_status, new_status)
        except OrderStatusError as error:
            logger.warning(f"Order {order_id}: transición rechazada ({error})")
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

        now = datetime.now(timezone.utc)
        applied = await self.order_repo.set_status_if_current(
            order_id, current_status, new_status, now
        )
        if not applied:
            # Otro administrador (o el mismo, dos veces) cambió el estado entre
            # la lectura y la escritura: no se devuelve stock dos veces.
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Order status changed while it was being updated; "
                    "reload the order and try again"
                ),
            )

        if new_status == "cancelled":
            items = order.get("items", [])
            restored = await self.order_repo.restore_items_stock(items)
            if len(restored) != len(items):
                logger.warning(
                    f"Order {order_id} cancelled with {len(items) - len(restored)} "
                    "item(s) whose product no longer exists"
                )

        order["status"] = new_status
        order["updated_at"] = now
        logger.info(f"Order {order_id}: {current_status} -> {new_status}")
        return _to_order_out(order)


def get_admin_order_service() -> AdminOrderService:
    """Dependencia de FastAPI: servicio con el repositorio real."""
    return AdminOrderService()
