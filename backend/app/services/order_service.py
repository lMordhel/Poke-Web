import logging
from datetime import datetime, timezone
from fastapi import HTTPException, status
from typing import List, Optional
from app.repositories.order_repository import OrderRepository
from app.schemas.order import OrderCreate, OrderOut
from app.services.pricing import (
    PricingError,
    compute_order_total,
    resolve_order_items,
    totals_match,
)

logger = logging.getLogger("api.orders")


class OrderService:
    def __init__(self, order_repo: Optional[OrderRepository] = None):
        # Inyectable para poder probar la regla de negocio sin MongoDB.
        self.order_repo = order_repo if order_repo is not None else OrderRepository()

    async def create_order(self, user_id: str, payload: OrderCreate) -> OrderOut:
        if not payload.items or len(payload.items) == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart cannot be empty")

        # 1. Resolver precio, nombre, tipo e imagen desde el catálogo real.
        try:
            products = await self.order_repo.get_products_by_ids(
                [item.id for item in payload.items]
            )
            items = resolve_order_items(payload.items, products)
        except PricingError as error:
            logger.warning(f"Order rejected for user {user_id}: {error}")
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

        # 2. El total lo calcula el servidor. Si el cliente declaró otro, el
        #    carrito está desactualizado o manipulado: no se escribe nada.
        total = compute_order_total(items)
        if not totals_match(payload.total, total):
            logger.warning(
                f"Order total mismatch for user {user_id}: "
                f"declared {payload.total}, expected {total}"
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Order total mismatch: declared {payload.total}, expected {total}",
            )

        order_data = {
            "items": items,
            "total": total,
            "user_id": user_id,
            "status": "pending",
            "created_at": datetime.now(timezone.utc),
        }

        try:
            created_order = await self.order_repo.create_with_transaction(order_data)
            logger.info(
                f"Order created successfully for user {user_id}, Order ID: {created_order['_id']}"
            )
            return OrderOut(id=str(created_order["_id"]), **order_data)
        except ValueError as ve:
            logger.warning(f"Stock error creating order for user {user_id}: {str(ve)}")
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(ve))
        except Exception as e:
            logger.error(f"Failed to create order for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to proceed with checkout",
            )

    async def get_user_orders(self, user_id: str) -> List[OrderOut]:
        orders = await self.order_repo.get_by_user_id(user_id)
        return [OrderOut(id=str(o.pop("_id")), **o) for o in orders]
