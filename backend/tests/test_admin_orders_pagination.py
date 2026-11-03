"""Pagination for the admin order list (S52).

The admin panel used to receive a flat list capped at 100 with no way to know
whether anything had been left out. The endpoint now reports the page, the page
size, the total matching orders and whether another page exists, while keeping
the guards intact: no session is 401 and no admin role is 403 (S35).

The order is the same as before - newest first - so page 1 is what an
administrator was already seeing.
"""

import asyncio
from datetime import datetime, timedelta, timezone

import httpx
import pytest
from bson import ObjectId
from fastapi import FastAPI, HTTPException

from app.api.v1.endpoints import admin as admin_endpoint
from app.core.security import get_current_admin_user
from app.repositories.order_repository import OrderRepository
from app.services.admin_order_service import AdminOrderService, get_admin_order_service

ADMIN = {"id": "65cde00000000000000000aa", "role": "admin"}
CUSTOMER_ID = "65cde00000000000000000bb"

T0 = datetime(2026, 10, 1, 12, 0, tzinfo=timezone.utc)


# --- In-memory `orders` collection ---------------------------------------


class FakeCursor:
    def __init__(self, documents):
        self._documents = list(documents)

    def sort(self, field, direction):
        self._documents.sort(key=lambda doc: doc.get(field), reverse=direction < 0)
        return self

    def skip(self, count):
        self._documents = self._documents[count:]
        return self

    async def to_list(self, length):
        return self._documents[:length]


class FakeCollection:
    def __init__(self, documents=()):
        self.documents = list(documents)

    def find(self, query=None):
        return FakeCursor(self.documents)

    async def count_documents(self, query):
        return len(self.documents)


def build_order(index):
    return {
        "_id": ObjectId(f"{index:024x}"),
        "user_id": CUSTOMER_ID,
        "items": [
            {
                "id": "65cde0000000000000000001",
                "name": f"Plush {index}",
                "price": 10.0,
                "quantity": 1,
                "type": "Electric",
                "img": "https://cdn.example/plush.webp",
                "size": None,
            }
        ],
        "total": 10.0,
        "status": "pending",
        # Oldest first by index, so the newest order is the highest index.
        "created_at": T0 + timedelta(days=index),
    }


def build_service(count=5):
    order_collection = FakeCollection([build_order(index) for index in range(count)])
    repo = OrderRepository(orders=order_collection, products=FakeCollection())
    return AdminOrderService(order_repo=repo)


def build_api(service=None):
    app = FastAPI()
    app.include_router(admin_endpoint.router, prefix="/admin")
    if service is not None:
        app.dependency_overrides[get_admin_order_service] = lambda: service
        app.dependency_overrides[get_current_admin_user] = lambda: ADMIN
    return app


def http_call(app, path):
    async def run():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.get(f"/admin/orders{path}")

    return asyncio.run(run())


# --- S52: page metadata --------------------------------------------------


def test_a_page_reports_where_it_is_and_how_many_orders_exist():
    """S52: page 2 of size 2 over 5 orders reports its position and the total."""
    response = http_call(build_api(build_service()), "?page=2&limit=2")

    assert response.status_code == 200
    body = response.json()
    assert len(body["orders"]) == 2
    assert body["total"] == 5
    assert body["page"] == 2
    assert body["limit"] == 2
    assert body["pages"] == 3
    assert body["has_more"] is True


def test_the_newest_order_is_still_the_first_one():
    """PRESERVE (S35): the list keeps being newest-first after paging."""
    body = http_call(build_api(build_service()), "?page=1&limit=1").json()

    assert body["orders"][0]["items"][0]["name"] == "Plush 4"


def test_the_last_page_reports_that_there_is_nothing_more():
    """S52: a short last page sets `has_more` to false."""
    body = http_call(build_api(build_service()), "?page=3&limit=2").json()

    assert len(body["orders"]) == 1
    assert body["has_more"] is False


def test_the_defaults_keep_the_previous_cap_and_first_page():
    """PRESERVE (S35): no parameters means page 1 with the 100-order cap."""
    body = http_call(build_api(build_service(count=3)), "").json()

    assert body["page"] == 1
    assert body["limit"] == 100
    assert body["total"] == 3


def test_a_page_past_the_end_is_an_empty_page_not_an_error():
    """S52: page 99 answers 200 with no orders."""
    response = http_call(build_api(build_service()), "?page=99&limit=2")

    assert response.status_code == 200
    assert response.json()["orders"] == []


def test_a_limit_over_one_hundred_is_rejected():
    """S35/S52: the 100-order cap per page is still enforced."""
    assert http_call(build_api(build_service()), "?limit=101").status_code == 422


def test_a_page_below_one_is_rejected():
    """S52: pages are 1-based."""
    assert http_call(build_api(build_service()), "?page=0").status_code == 422


# --- S35: the guards survive the new response shape ----------------------


def test_without_a_session_the_listing_is_401():
    """S35: the new shape does not open the endpoint."""
    assert http_call(build_api(), "").status_code == 401


def test_a_session_without_the_admin_role_is_403():
    """S35: authentication alone is not authorisation."""
    with pytest.raises(HTTPException) as error:
        asyncio.run(get_current_admin_user({"id": CUSTOMER_ID, "role": "user"}))

    assert error.value.status_code == 403
