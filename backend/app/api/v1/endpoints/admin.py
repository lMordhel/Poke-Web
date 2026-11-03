from fastapi import APIRouter, Depends, Query
from typing import List
from app.core.security import get_current_admin_user
from app.schemas.order import OrderOut, OrderPage, OrderStatusUpdate
from app.schemas.user import UserOut
from app.services.admin_order_service import AdminOrderService, get_admin_order_service
from app.db import db

router = APIRouter()

@router.get("/users", response_model=List[UserOut])
async def get_all_users(current_admin: dict = Depends(get_current_admin_user)):
    """
    Endpoint para obtener todos los usuarios registrados.
    Solo accesible para usuarios con rol 'admin'.
    """
    users_cursor = db.users.find()
    users = await users_cursor.to_list(length=100) # Límite para evitar sobrecarga (puede añadirse paginación)
    
    # Formatear el ID para Pydantic
    formatted_users = []
    for user in users:
        user_id = str(user.pop("_id", ""))
        if user_id:
            user["id"] = user_id
        # Si el token no tiene username ni demás, pasarlo igual (el Schema hará validación)
        formatted_users.append(user)
        
    return formatted_users

@router.get("/orders", response_model=OrderPage)
async def get_all_orders(
    page: int = Query(1, ge=1, description="Número de página, base 1"),
    limit: int = Query(100, ge=1, le=100, description="Pedidos por página (tope 100)"),
    service: AdminOrderService = Depends(get_admin_order_service),
    current_admin: dict = Depends(get_current_admin_user),
):
    """
    Lista los pedidos de todos los usuarios, los más recientes primero, con la
    página, el tamaño de página, el total y si queda otra página (S52).
    Solo accesible para usuarios con rol 'admin'.
    """
    return await service.list_orders(page=page, limit=limit)


@router.patch("/orders/{order_id}", response_model=OrderOut)
async def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    service: AdminOrderService = Depends(get_admin_order_service),
    current_admin: dict = Depends(get_current_admin_user),
):
    """
    Avanza o cancela un pedido. Las transiciones permitidas viven en
    `app/services/order_status.py`; cancelar devuelve el stock (S37, S39).
    """
    return await service.update_status(order_id, payload.status)


@router.get("/stats")
async def get_dashboard_stats(current_admin: dict = Depends(get_current_admin_user)):
    """
    Retorna métricas reales leyendo directamente las colecciones de MongoDB
    para el Dashboard Administrativo.
    """
    try:
        total_users = await db.users.count_documents({})
        total_products = await db.products.count_documents({})
        
        # Colección de orders (la crea implícitamente Mongo si no existe y devolverá 0)
        total_orders = await db.orders.count_documents({})
        
        total_revenue = 0.0
        if total_orders > 0:
            # Agregación para sumar los ingresos ('total_amount') de todos los pedidos
            pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}]
            revenue_cursor = db.orders.aggregate(pipeline)
            revenue_data = await revenue_cursor.to_list(length=1)
            total_revenue = float(revenue_data[0].get("total", 0.0)) if revenue_data else 0.0
            
        return {
            "products": total_products,
            "users": total_users,
            "orders": total_orders,
            "revenue": total_revenue
        }
    except Exception as e:
        print(f"Error en /admin/stats: {e}")
        return {
            "products": 0,
            "users": 0,
            "orders": 0,
            "revenue": 0.0
        }
