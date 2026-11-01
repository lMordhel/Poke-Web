"""Ciclo de vida de pedidos desde el panel de administración (S35-S42).

Estos tests fijan dos reglas con consecuencias reales:

- solo se avanza por la tabla de transiciones (S37), y un intento inválido no
  deja ningún rastro en la base (S37, S38);
- cancelar un pedido devuelve al inventario exactamente lo que el checkout
  descontó, una sola vez aunque dos administradores lo intenten (S39, S40).

Las colecciones falsas imitan a Motor (mismo filtro, `$set` y `$inc`) para que
las consultas reales de `OrderRepository` sean las que se ejecutan.
"""

import asyncio
import copy
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import httpx
import pytest
from bson import ObjectId
from fastapi import FastAPI, HTTPException
from typing import get_args

from app.api.v1.endpoints import admin as admin_endpoint
from app.core.security import get_current_admin_user
from app.repositories.order_repository import OrderRepository
from app.schemas.order import OrderStatusUpdate
from app.services.admin_order_service import AdminOrderService, get_admin_order_service
from app.services.order_status import ORDER_STATUSES, OrderStatusError, ensure_transition

PIKACHU_ID = "65cde0000000000000000001"
CHARIZARD_ID = "65cde0000000000000000002"

ADMIN = {"id": "65cde00000000000000000aa", "role": "admin"}
CUSTOMER_ID = "65cde00000000000000000bb"

T0 = datetime(2026, 10, 1, 12, 0, tzinfo=timezone.utc)


# --- Colecciones falsas: mismo contrato que Motor -------------------------


class FakeResult:
    def __init__(self, matched_count):
        self.matched_count = matched_count
        self.modified_count = matched_count


class FakeCursor:
    def __init__(self, documents):
        self._documents = list(documents)

    def sort(self, field, direction):
        self._documents.sort(key=lambda doc: doc.get(field), reverse=direction < 0)
        return self

    async def to_list(self, length):
        return self._documents[:length]


def _variant(document, size):
    for variant in document.get("variants", []):
        if variant.get("size") == size:
            return variant
    return None


def _matches(document, query):
    for key, expected in query.items():
        if key == "_id":
            if str(document.get("_id")) != str(expected):
                return False
        elif key == "variants.size":
            if _variant(document, expected) is None:
                return False
        elif key == "variants.stock":
            variant = _variant(document, query.get("variants.size"))
            if variant is None or variant.get("stock", 0) < expected["$gte"]:
                return False
        elif isinstance(expected, dict) and "$gte" in expected:
            if document.get(key, 0) < expected["$gte"]:
                return False
        elif document.get(key) != expected:
            return False
    return True


def _apply(document, update, query):
    for key, value in update.get("$set", {}).items():
        document[key] = value
    for key, delta in update.get("$inc", {}).items():
        if key == "variants.$.stock":
            _variant(document, query["variants.size"])["stock"] += delta
        elif "." in key:
            raise AssertionError(f"ruta $inc inesperada: {key}")
        else:
            document[key] = document.get(key, 0) + delta


class FakeCollection:
    """Colección en memoria con las operaciones que usa `OrderRepository`."""

    def __init__(self, documents=()):
        self.documents = {str(doc["_id"]): copy.deepcopy(doc) for doc in documents}
        self.writes = 0

    def doc(self, document_id):
        return self.documents[str(document_id)]

    async def find_one(self, query):
        for document in self.documents.values():
            if _matches(document, query):
                return copy.deepcopy(document)
        return None

    def find(self, query=None):
        return FakeCursor(
            [
                copy.deepcopy(document)
                for document in self.documents.values()
                if _matches(document, query or {})
            ]
        )

    async def update_one(self, query, update):
        for document in self.documents.values():
            if _matches(document, query):
                _apply(document, update, query)
                self.writes += 1
                return FakeResult(1)
        return FakeResult(0)

    async def insert_one(self, document):
        self.documents[str(document["_id"])] = copy.deepcopy(document)
        return SimpleNamespace(inserted_id=document["_id"])


def build_order(status="pending", document_id=None, created_at=T0):
    return {
        "_id": document_id or ObjectId(),
        "user_id": CUSTOMER_ID,
        "items": [
            {
                "id": PIKACHU_ID,
                "name": "Pikachu Plush",
                "price": 29.99,
                "quantity": 2,
                "type": "Electric",
                "img": "https://cdn.example/pikachu.webp",
                "size": "20cm",
            },
            {
                "id": CHARIZARD_ID,
                "name": "Charizard Plush",
                "price": 27.99,
                "quantity": 1,
                "type": "Fire",
                "img": "https://cdn.example/charizard.webp",
                "size": None,
            },
        ],
        "total": 87.97,
        "status": status,
        "created_at": created_at,
    }


def build_products():
    return [
        {
            "_id": ObjectId(PIKACHU_ID),
            "name": "Pikachu Plush",
            "type": "Electric",
            "image_url": "https://cdn.example/pikachu.webp",
            "variants": [
                {"size": "20cm", "price": 29.99, "stock": 3},
                {"size": "35cm", "price": 49.99, "stock": 0},
            ],
            "sold_count": 10,
        },
        {
            "_id": ObjectId(CHARIZARD_ID),
            "name": "Charizard Plush",
            "type": "Fire",
            "image_url": "https://cdn.example/charizard.webp",
            "price": 27.99,
            "stock": 4,
            "sold_count": 7,
        },
    ]


def build_service(orders, products=None):
    order_collection = FakeCollection(orders)
    product_collection = FakeCollection(products if products is not None else build_products())
    repo = OrderRepository(orders=order_collection, products=product_collection)
    return AdminOrderService(order_repo=repo), order_collection, product_collection


def call(coroutine):
    return asyncio.run(coroutine)


def status_error(service, order_id, status):
    with pytest.raises(HTTPException) as error:
        call(service.update_status(order_id, status))
    return error.value


# --- S37: la tabla de transiciones ----------------------------------------


def test_cada_avance_permitido_es_aceptado():
    for current, target in (
        ("pending", "processing"),
        ("pending", "cancelled"),
        ("processing", "shipped"),
        ("processing", "cancelled"),
        ("shipped", "delivered"),
        ("shipped", "cancelled"),
    ):
        ensure_transition(current, target)

def test_saltar_un_paso_se_rechaza():
    for current, target in (
        ("pending", "shipped"),
        ("pending", "delivered"),
        ("processing", "delivered"),
    ):
        with pytest.raises(OrderStatusError):
            ensure_transition(current, target)


def test_los_estados_terminales_no_cambian():
    for terminal in ("delivered", "cancelled"):
        for target in ORDER_STATUSES:
            with pytest.raises(OrderStatusError):
                ensure_transition(terminal, target)


def test_el_mismo_estado_no_es_una_transicion():
    for status in ORDER_STATUSES:
        with pytest.raises(OrderStatusError):
            ensure_transition(status, status)


def test_el_contrato_http_acepta_exactamente_los_estados_del_ciclo():
    assert set(get_args(OrderStatusUpdate.model_fields["status"].annotation)) == set(ORDER_STATUSES)


# --- S39: cancelar devuelve el inventario --------------------------------


def test_cancelar_devuelve_la_variante_y_descuenta_sold_count():
    service, orders, products = build_service([build_order()])
    order_id = str(next(iter(orders.documents)))

    updated = call(service.update_status(order_id, "cancelled"))

    assert updated.status == "cancelled"
    assert orders.doc(order_id)["status"] == "cancelled"
    variant = _variant(products.doc(PIKACHU_ID), "20cm")
    assert variant["stock"] == 5  # 3 + 2
    assert products.doc(PIKACHU_ID)["sold_count"] == 8  # 10 - 2
    assert products.doc(CHARIZARD_ID)["stock"] == 5  # 4 + 1
    assert products.doc(CHARIZARD_ID)["sold_count"] == 6  # 7 - 1


def test_cancelar_no_toca_la_variante_que_no_se_compro():
    service, orders, products = build_service([build_order()])
    order_id = str(next(iter(orders.documents)))

    call(service.update_status(order_id, "cancelled"))

    assert _variant(products.doc(PIKACHU_ID), "35cm")["stock"] == 0


# --- S41: avanzar no toca el inventario ----------------------------------


def test_avanzar_el_pedido_no_escribe_en_el_inventario():
    service, orders, products = build_service([build_order()])
    order_id = str(next(iter(orders.documents)))

    updated = call(service.update_status(order_id, "processing"))

    assert updated.status == "processing"
    assert orders.doc(order_id)["status"] == "processing"
    assert products.writes == 0
    assert _variant(products.doc(PIKACHU_ID), "20cm")["stock"] == 3
    assert products.doc(CHARIZARD_ID)["stock"] == 4


def test_la_respuesta_conserva_items_total_usuario_y_fecha():
    order = build_order(status="shipped")
    service, orders, _ = build_service([order])
    order_id = str(order["_id"])

    updated = call(service.update_status(order_id, "delivered"))

    assert updated.status == "delivered"
    assert updated.total == pytest.approx(87.97)
    assert updated.user_id == CUSTOMER_ID
    assert updated.created_at == T0
    assert [item.size for item in updated.items] == ["20cm", None]


# --- S37/S38: rechazos que no escriben nada ------------------------------


def test_una_transicion_invalida_no_escribe_nada():
    service, orders, products = build_service([build_order(status="delivered")])
    order_id = str(next(iter(orders.documents)))

    error = status_error(service, order_id, "shipped")

    assert error.status_code == 409
    assert orders.doc(order_id)["status"] == "delivered"
    assert orders.writes == 0
    assert products.writes == 0


def test_un_pedido_inexistente_responde_404():
    service, orders, products = build_service([build_order()])

    error = status_error(service, str(ObjectId()), "processing")

    assert error.status_code == 404
    assert orders.writes == 0
    assert products.writes == 0


def test_un_identificador_invalido_responde_404_no_500():
    service, orders, products = build_service([build_order()])

    error = status_error(service, "no-es-un-objectid", "processing")

    assert error.status_code == 404
    assert orders.writes == 0
    assert products.writes == 0


# --- S40: doble cancelación ----------------------------------------------


def test_cancelar_dos_veces_devuelve_el_stock_una_sola_vez():
    service, orders, products = build_service([build_order()])
    order_id = str(next(iter(orders.documents)))

    call(service.update_status(order_id, "cancelled"))
    stock_after_first = _variant(products.doc(PIKACHU_ID), "20cm")["stock"]
    sold_after_first = products.doc(PIKACHU_ID)["sold_count"]

    error = status_error(service, order_id, "cancelled")

    assert error.status_code == 409
    assert _variant(products.doc(PIKACHU_ID), "20cm")["stock"] == stock_after_first
    assert products.doc(PIKACHU_ID)["sold_count"] == sold_after_first
    assert orders.doc(order_id)["status"] == "cancelled"


class StaleReadCollection(FakeCollection):
    """Otro administrador escribió entre la lectura y la escritura (S40).

    `find_one` devuelve el estado anterior, que ya no es el de la base: es la
    única forma de ejercitar el filtro condicional del `update_one` real.
    """

    async def find_one(self, query):
        document = await super().find_one(query)
        if document is not None:
            document["status"] = "pending"
        return document


def test_una_carrera_al_cancelar_no_devuelve_el_stock_ni_cambia_el_estado():
    orders = StaleReadCollection([build_order(status="processing")])
    products = FakeCollection(build_products())
    service = AdminOrderService(order_repo=OrderRepository(orders=orders, products=products))
    order_id = str(next(iter(orders.documents)))

    error = status_error(service, order_id, "cancelled")

    assert error.status_code == 409
    assert "reload" in error.detail.lower()
    assert orders.doc(order_id)["status"] == "processing"
    assert products.writes == 0
    assert _variant(products.doc(PIKACHU_ID), "20cm")["stock"] == 3


# --- S42: el producto ya no existe ---------------------------------------


def test_cancelar_completa_aunque_el_producto_ya_no_exista():
    products = [product for product in build_products() if str(product["_id"]) != PIKACHU_ID]
    service, orders, product_collection = build_service([build_order()], products)
    order_id = str(next(iter(orders.documents)))

    updated = call(service.update_status(order_id, "cancelled"))

    assert updated.status == "cancelled"
    assert orders.doc(order_id)["status"] == "cancelled"
    assert product_collection.doc(CHARIZARD_ID)["stock"] == 5  # el que sí existe se devuelve


# --- S35: listado de pedidos --------------------------------------------


def test_el_listado_devuelve_los_mas_recientes_primero():
    older = build_order(created_at=T0)
    newer = build_order(created_at=T0 + timedelta(days=1))
    service, _, _ = build_service([older, newer])

    listed = call(service.list_orders())

    assert [order.id for order in listed] == [str(newer["_id"]), str(older["_id"])]
    assert listed[0].status == "pending"


def test_el_listado_respeta_el_limite():
    orders = [build_order(created_at=T0 + timedelta(hours=index)) for index in range(5)]
    service, _, _ = build_service(orders)

    listed = call(service.list_orders(limit=2))

    assert len(listed) == 2


# --- S35/S36: contrato HTTP y guardia de administrador -------------------


class StubService:
    """Servicio mínimo para probar rutas, códigos y guardias."""

    def __init__(self, orders=None, error=None):
        self._orders = orders or []
        self._error = error

    async def list_orders(self, limit=100):
        return self._orders

    async def update_status(self, order_id, status):
        if self._error:
            raise self._error
        return self._orders[0]


def build_api(service=None):
    """Router real de admin; sin `service` no se sustituye nada (ruta sin sesión)."""
    app = FastAPI()
    app.include_router(admin_endpoint.router, prefix="/admin")
    if service is not None:
        app.dependency_overrides[get_admin_order_service] = lambda: service
        app.dependency_overrides[get_current_admin_user] = lambda: ADMIN
    return app


def http_call(app, method, path, json=None):
    async def run():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.request(method, path, json=json)

    return asyncio.run(run())


def test_sin_sesion_el_listado_responde_401():
    response = http_call(build_api(), "GET", "/admin/orders")

    assert response.status_code == 401


def test_una_sesion_sin_rol_admin_responde_403():
    with pytest.raises(HTTPException) as error:
        call(get_current_admin_user({"id": CUSTOMER_ID, "role": "user"}))

    assert error.value.status_code == 403


def test_el_listado_devuelve_los_pedidos():
    from app.schemas.order import OrderOut

    order = build_order()
    service = StubService(orders=[OrderOut(id=str(order["_id"]), **_without_id(order))])

    response = http_call(build_api(service), "GET", "/admin/orders")

    assert response.status_code == 200
    assert response.json()[0]["status"] == "pending"
    assert response.json()[0]["id"] == str(order["_id"])


def test_un_estado_desconocido_responde_422_y_no_escribe_nada():
    service = StubService(orders=[])
    app = build_api(service)

    response = http_call(app, "PATCH", f"/admin/orders/{ObjectId()}", json={"status": "enviado"})

    assert response.status_code == 422


def test_un_conflicto_de_estado_responde_409():
    service = StubService(error=HTTPException(status_code=409, detail="No puedes pasar de delivered a shipped"))
    app = build_api(service)

    response = http_call(app, "PATCH", f"/admin/orders/{ObjectId()}", json={"status": "shipped"})

    assert response.status_code == 409
    assert "delivered" in response.json()["detail"]


def _without_id(order):
    return {key: value for key, value in order.items() if key != "_id"}
