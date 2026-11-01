from typing import List, Optional, Tuple
from app.db import client, db
from bson import ObjectId
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

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

    async def list_all(self, limit: int = 100) -> List[dict]:
        """Pedidos de todos los usuarios, los más recientes primero (S35)."""
        cursor = self.collection.find({}).sort("created_at", -1)
        return await cursor.to_list(length=limit)

    async def get_by_id(self, order_id: str) -> Optional[dict]:
        """El pedido pedido, o `None` si el id es inválido o no existe (S38)."""
        if not ObjectId.is_valid(str(order_id)):
            return None
        return await self.collection.find_one({"_id": ObjectId(str(order_id))})

    async def set_status_if_current(
        self,
        order_id: str,
        expected_status: str,
        new_status: str,
        now: datetime,
    ) -> bool:
        """Cambia el estado solo si sigue siendo `expected_status` (S40).

        El filtro incluye el estado actual, así que dos administradores (o dos
        clics) no pueden aplicar el mismo cambio dos veces: el segundo no
        encuentra el documento y recibe `False`, sin devolver stock de nuevo.
        """
        result = await self.collection.update_one(
            {"_id": ObjectId(str(order_id)), "status": expected_status},
            {"$set": {"status": new_status, "updated_at": now}},
        )
        return result.matched_count == 1

    async def restore_items_stock(self, items: List[dict]) -> Tuple[List[str], List[str]]:
        """Devuelve al inventario lo que el checkout descontó (S39).

        Cada ítem vuelve a su talla/variante si la declara, o al `stock` del
        producto si no. Devuelve `(restored, failed)`: los ítems devueltos y los
        que no se pudieron devolver. Un producto borrado se omite y no se
        inventa inventario: la cancelación del pedido ya es un hecho (S42), así
        que no cuenta como fallo. En cambio una variante que ya no existe, un id
        inválido o una escritura que falla sí se reportan, porque el inventario
        quedó incompleto y hay que corregirlo a mano.

        Cada ítem se intenta por separado: uno que falle nunca impide devolver
        el stock de los demás.
        """
        restored: List[str] = []
        failed: List[str] = []

        for item in items:
            product_id = str(item.get("id"))
            try:
                if not ObjectId.is_valid(product_id):
                    failed.append(product_id)
                    continue

                quantity = item["quantity"]
                size = item.get("size")
                if size:
                    result = await self.products.update_one(
                        {"_id": ObjectId(product_id), "variants.size": size},
                        {"$inc": {"variants.$.stock": quantity, "sold_count": -quantity}},
                    )
                else:
                    result = await self.products.update_one(
                        {"_id": ObjectId(product_id)},
                        {"$inc": {"stock": quantity, "sold_count": -quantity}},
                    )

                if result.matched_count == 1:
                    restored.append(product_id)
                    continue

                # Ninguna escritura coincidió: solo un producto borrado es
                # esperado (S42). Si el producto existe, lo que ya no existe es
                # la variante y ese stock no se puede devolver.
                if await self.products.find_one({"_id": ObjectId(product_id)}) is not None:
                    failed.append(product_id)
            except Exception:
                logger.exception(
                    f"Order item {product_id}: no se pudo devolver el stock"
                )
                failed.append(product_id)

        return restored, failed
