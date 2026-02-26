from fastapi import APIRouter
from app.api.v1.endpoints import auth, products, admin, orders, activity, home

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(activity.router, prefix="/activity", tags=["activity"])
api_router.include_router(home.router, prefix="/home", tags=["home"])
