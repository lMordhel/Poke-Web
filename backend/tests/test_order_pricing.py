"""Contrato de creación de pedidos (S1-S7 de odd/tasks/poke-web-hardening.md).

Estos tests fijan la regla de negocio central: el precio y el total de un pedido
los decide el servidor desde MongoDB, nunca el cliente.
"""

import pytest
from bson import ObjectId
from fastapi import HTTPException

from app.schemas.order import OrderCreate
from app.services.order_service import OrderService

PIKACHU_ID = "65cde0000000000000000001"
CHARIZARD_ID = "65cde0000000000000000002"

PIKACHU = {
    "_id": ObjectId(PIKACHU_ID),
    "name": "Pikachu Plush",
    "type": "Electric",
    "image_url": "https://cdn.example/pikachu.webp",
    "variants": [
        {"size": "20cm", "price": 29.99, "stock": 5},
        {"size": "35cm", "price": 49.99, "stock": 0},
    ],
    "sold_count": 0,
}

CHARIZARD = {
    "_id": ObjectId(CHARIZARD_ID),
    "name": "Charizard Plush",
    "type": "Fire",
    "image_url": "https://cdn.example/charizard.webp",
    "price": 27.99,
    "stock": 3,
    "sold_count": 0,
}

CATALOG = [PIKACHU, CHARIZARD]


class FakeOrderRepository:
    """Repositorio en memoria: aísla la regla de negocio de MongoDB."""

    def __init__(self, products=None, stock_error=None):
        self._products = {str(p["_id"]): p for p in (products or [])}
        self._stock_error = stock_error
        self.created_orders = []

    async def get_products_by_ids(self, product_ids):
        return [
            self._products[str(product_id)]
            for product_id in product_ids
            if str(product_id) in self._products
        ]

    async def create_with_transaction(self, order_data):
        if self._stock_error:
            raise ValueError(self._stock_error)
        self.created_orders.append(order_data)
        return {**order_data, "_id": ObjectId()}


def build_payload(*items, total=None):
    return OrderCreate(items=list(items), total=total)


def qty_item(product_id, quantity=1, size=None):
    item = {"id": product_id, "quantity": quantity}
    if size is not None:
        item["size"] = size
    return item


# --- S2: el total declarado no puede contradecir al servidor ----------------


async def test_total_manipulado_se_rechaza_sin_escribir_nada():
    repo = FakeOrderRepository(CATALOG)
    service = OrderService(order_repo=repo)

    payload = build_payload(qty_item(PIKACHU_ID, 1, "20cm"), total=0.01)

    with pytest.raises(HTTPException) as error:
        await service.create_order("user-1", payload)

    assert error.value.status_code == 409
    assert "total" in error.value.detail.lower()
    assert repo.created_orders == []


async def test_total_manipulado_a_la_baja_en_carrito_multiple_se_rechaza():
    repo = FakeOrderRepository(CATALOG)
    service = OrderService(order_repo=repo)

    payload = build_payload(
        qty_item(PIKACHU_ID, 2, "20cm"),
        qty_item(CHARIZARD_ID, 1),
        total=1.00,
    )

    with pytest.raises(HTTPException) as error:
        await service.create_order("user-1", payload)

    assert error.value.status_code == 409
    assert repo.created_orders == []


# --- S1/S5: precio y total autoritativos -----------------------------------


async def test_precio_y_total_los_calcula_el_servidor():
    repo = FakeOrderRepository(CATALOG)
    service = OrderService(order_repo=repo)

    payload = build_payload(
        qty_item(PIKACHU_ID, 2, "20cm"),
        qty_item(CHARIZARD_ID, 1),
        total=87.97,
    )

    order = await service.create_order("user-1", payload)

    # 2 * 29.99 + 1 * 27.99 = 87.97
    assert order.total == pytest.approx(87.97)
    assert len(repo.created_orders) == 1
    stored = repo.created_orders[0]
    assert stored["total"] == pytest.approx(87.97)
    assert stored["status"] == "pending"
    assert stored["user_id"] == "user-1"
    assert [item["price"] for item in stored["items"]] == [
        pytest.approx(29.99),
        pytest.approx(27.99),
    ]
    assert [item["name"] for item in stored["items"]] == [
        "Pikachu Plush",
        "Charizard Plush",
    ]
    assert [item["img"] for item in stored["items"]] == [
        "https://cdn.example/pikachu.webp",
        "https://cdn.example/charizard.webp",
    ]


async def test_cliente_no_puede_inyectar_precio_ni_nombre():
    repo = FakeOrderRepository(CATALOG)
    service = OrderService(order_repo=repo)

    payload = build_payload(
        {
            "id": PIKACHU_ID,
            "quantity": 1,
            "size": "20cm",
            "price": 0.01,
            "name": "Producto falso",
            "type": "Free",
            "img": "https://evil.example/x.png",
        },
        total=29.99,
    )

    order = await service.create_order("user-1", payload)

    assert order.total == pytest.approx(29.99)
    stored_item = repo.created_orders[0]["items"][0]
    assert stored_item["price"] == pytest.approx(29.99)
    assert stored_item["name"] == "Pikachu Plush"
    assert stored_item["type"] == "Electric"
    assert stored_item["img"] == "https://cdn.example/pikachu.webp"


async def test_pedido_sin_total_declarado_usa_el_del_servidor():
    repo = FakeOrderRepository(CATALOG)
    service = OrderService(order_repo=repo)

    order = await service.create_order(
        "user-1", build_payload(qty_item(PIKACHU_ID, 1, "20cm"))
    )

    assert order.total == pytest.approx(29.99)


# --- S3: producto o variante inexistente ----------------------------------


async def test_producto_inexistente_se_rechaza_sin_escribir():
    repo = FakeOrderRepository(CATALOG)
    service = OrderService(order_repo=repo)

    payload = build_payload(qty_item("65cde00000000000000000ff", 1, "20cm"), total=29.99)

    with pytest.raises(HTTPException) as error:
        await service.create_order("user-1", payload)

    assert error.value.status_code == 409
    assert repo.created_orders == []


async def test_talla_inexistente_se_rechaza_sin_escribir():
    repo = FakeOrderRepository(CATALOG)
    service = OrderService(order_repo=repo)

    payload = build_payload(qty_item(PIKACHU_ID, 1, "999cm"), total=29.99)

    with pytest.raises(HTTPException) as error:
        await service.create_order("user-1", payload)

    assert error.value.status_code == 409
    assert repo.created_orders == []


async def test_producto_con_variantes_exige_talla():
    repo = FakeOrderRepository(CATALOG)
    service = OrderService(order_repo=repo)

    payload = build_payload(qty_item(PIKACHU_ID, 1), total=29.99)

    with pytest.raises(HTTPException) as error:
        await service.create_order("user-1", payload)

    assert error.value.status_code == 409
    assert repo.created_orders == []


@pytest.mark.parametrize("quantity", [0, -3])
def test_cantidad_debe_ser_positiva(quantity):
    with pytest.raises(Exception):
        build_payload(qty_item(PIKACHU_ID, quantity, "20cm"), total=29.99)


# --- S4: stock insuficiente (comportamiento preservado) -------------------


async def test_stock_insuficiente_sigue_devolviendo_409():
    repo = FakeOrderRepository(CATALOG, stock_error="Out of stock or invalid product/variant: Pikachu Plush")
    service = OrderService(order_repo=repo)

    payload = build_payload(qty_item(PIKACHU_ID, 99, "20cm"), total=2969.01)

    with pytest.raises(HTTPException) as error:
        await service.create_order("user-1", payload)

    assert error.value.status_code == 409
    assert repo.created_orders == []


# --- S6: carrito vacío ---------------------------------------------------


def test_carrito_vacio_no_es_un_payload_valido():
    with pytest.raises(Exception):
        OrderCreate(items=[], total=0)


# --- S7: la ruta sigue protegida -----------------------------------------


def test_la_ruta_de_pedidos_exige_autenticacion():
    """S7: sin sesión válida, el checkout responde 401 y no toca MongoDB."""
    import asyncio

    import httpx
    from fastapi import FastAPI

    from app.api.v1.endpoints import orders as orders_endpoint

    app = FastAPI()
    app.include_router(orders_endpoint.router, prefix="/orders")

    async def call():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.post(
                "/orders/",
                json={"items": [{"id": PIKACHU_ID, "quantity": 1, "size": "20cm"}], "total": 29.99},
            )

    response = asyncio.run(call())

    assert response.status_code == 401
