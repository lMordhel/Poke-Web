from fastapi import APIRouter, Depends
from typing import List
from app.core.security import get_current_admin_user
from app.schemas.user import UserOut
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
