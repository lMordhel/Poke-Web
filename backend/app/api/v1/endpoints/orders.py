from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.schemas.order import OrderCreate, OrderOut
from app.services.order_service import OrderService
import logging

logger = logging.getLogger("api.orders")
router = APIRouter()

@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(payload: OrderCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    order_service = OrderService()
    return await order_service.create_order(user_id, payload)

@router.get("/", response_model=list[OrderOut])
async def get_user_orders(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    order_service = OrderService()
    return await order_service.get_user_orders(user_id)
