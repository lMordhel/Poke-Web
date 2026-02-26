import logging
from datetime import datetime, timezone
from fastapi import HTTPException, status
from typing import List
from app.repositories.order_repository import OrderRepository
from app.schemas.order import OrderCreate, OrderOut

logger = logging.getLogger("api.orders")

class OrderService:
    def __init__(self):
        self.order_repo = OrderRepository()

    async def create_order(self, user_id: str, payload: OrderCreate) -> OrderOut:
        if not payload.items or len(payload.items) == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart cannot be empty")
            
        order_data = payload.model_dump()
        order_data["user_id"] = user_id
        order_data["status"] = "pending"
        order_data["created_at"] = datetime.now(timezone.utc)
        
        try:
            created_order = await self.order_repo.create_with_transaction(order_data)
            logger.info(f"Order created successfully for user {user_id}, Order ID: {created_order['_id']}")
            return OrderOut(id=str(created_order["_id"]), **order_data)
        except ValueError as ve:
            logger.warning(f"Stock error creating order for user {user_id}: {str(ve)}")
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(ve))
        except Exception as e:
            logger.error(f"Failed to create order for user {user_id}: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to proceed with checkout")

    async def get_user_orders(self, user_id: str) -> List[OrderOut]:
        orders = await self.order_repo.get_by_user_id(user_id)
        return [OrderOut(id=str(o.pop("_id")), **o) for o in orders]
