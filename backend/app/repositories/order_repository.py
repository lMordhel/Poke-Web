from typing import List, Optional
from app.db import client, db
from bson import ObjectId
from datetime import datetime, timezone

class OrderRepository:
    def __init__(self, orders=None, products=None):
        # Inyectables para poder probar sin MongoDB.
        self.collection = orders if orders is not None else db.orders
        self.products = products if products is not None else db.products

    async def get_products_by_ids(self, product_ids: List[str]) -> List[dict]:
        """Trae los productos reales del catálogo en una sola consulta.

        Los IDs inválidos se descartan: un pedido con producto inexistente debe
        rechazarse con 409 en la capa de servicio, nunca con un 500 de BSON.
        """
        valid_ids = [ObjectId(pid) for pid in product_ids if ObjectId.is_valid(str(pid))]
        if not valid_ids:
            return []

        cursor = self.products.find({"_id": {"$in": valid_ids}})
        return await cursor.to_list(length=len(valid_ids))

    @staticmethod
    def _to_object_id(product_id: str) -> ObjectId:
        if not ObjectId.is_valid(str(product_id)):
            raise ValueError(f"Unknown product: {product_id}")
        return ObjectId(str(product_id))

    async def create_with_transaction(self, order_data: dict) -> dict:
        # Fallback for Standalone MongoDB (common in local dev)
        # We manually rollback if something fails since transactions might not be supported.
        stock_rollbacks = []
        try:
            # 1. Deduct stock atomically
            for item in order_data["items"]:
                product_id = self._to_object_id(item["id"])
                quantity = item["quantity"]
                size = item.get("size")
                
                if size:
                    # It's a variant purchase
                    updated = await self.products.find_one_and_update(
                        {"_id": product_id, "variants.size": size, "variants.stock": {"$gte": quantity}},
                        {"$inc": {"variants.$.stock": -quantity, "sold_count": quantity}},
                        return_document=True
                    )
                else:
                    # Legacy fallback
                    updated = await self.products.find_one_and_update(
                        {"_id": product_id, "stock": {"$gte": quantity}},
                        {"$inc": {"stock": -quantity, "sold_count": quantity}},
                        return_document=True
                    )
                
                if not updated:
                    raise ValueError(f"Out of stock or invalid product/variant: {item['name']}")
                
                stock_rollbacks.append((product_id, quantity, size))
            
            # 2. Create the order (items already carry server-side prices)
            result = await self.collection.insert_one(order_data)
            order_data["_id"] = result.inserted_id
            
            return order_data

        except Exception as e:
            # Manual Rollback
            for p_id, q, size in stock_rollbacks:
                if size:
                    await self.products.update_one(
                        {"_id": p_id, "variants.size": size},
                        {"$inc": {"variants.$.stock": q, "sold_count": -q}}
                    )
                else:
                    await self.products.update_one(
                        {"_id": p_id},
                        {"$inc": {"stock": q, "sold_count": -q}}
                    )
            raise e

    async def get_by_user_id(self, user_id: str, limit: int = 100) -> List[dict]:
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1)
        return await cursor.to_list(length=limit)
