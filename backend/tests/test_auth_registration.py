"""Registration contract: one account per email (S10 of odd/tasks/poke-web-hardening.md).

A duplicate email is a conflict (409), never a server error (500), both when the
pre-check finds the account and when two concurrent requests slip past it and
MongoDB rejects the second insert through the unique index.
"""

import asyncio

import httpx
import pytest
from bson import ObjectId
from fastapi import FastAPI, HTTPException
from pymongo.errors import DuplicateKeyError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.endpoints import auth as auth_endpoint
from app.core.limiter import limiter
from app.schemas.user import UserCreate
from app.services import auth_service as auth_service_module
from app.services.auth_service import AuthService

DUPLICATE_KEY_MESSAGE = (
    "E11000 duplicate key error collection: webpoke_test.users index: email_1 "
    'dup key: { email: "ash@example.com" }'
)

REGISTER_BODY = {
    "email": "ash@example.com",
    "password": "pikachu-123",
    "name": "Ash",
}


class FakeUserRepository:
    """In-memory user store that can simulate the MongoDB unique-index race."""

    def __init__(self, existing=None, create_error=None):
        self._existing = existing
        self._create_error = create_error
        self.created = []
        self.lookups = []

    async def get_by_email(self, email):
        self.lookups.append(email)
        return self._existing

    async def create(self, user_data):
        if self._create_error is not None:
            raise self._create_error
        self.created.append(user_data)
        return {**user_data, "_id": ObjectId()}


def build_service(monkeypatch, repo):
    """Wire the service to the fake repository instead of Motor."""
    monkeypatch.setattr(auth_service_module, "UserRepository", lambda: repo)
    return AuthService()


def build_app(monkeypatch, repo):
    """Smallest app that exposes the real /auth/register route."""
    monkeypatch.setattr(auth_service_module, "UserRepository", lambda: repo)
    app = FastAPI()
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.include_router(auth_endpoint.router, prefix="/auth")
    return app


def post_register(app, body):
    async def call():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.post("/auth/register", json=body)

    return asyncio.run(call())


# --- S10: duplicate email is a 409 conflict, never a 500 -------------------


async def test_email_existente_en_la_verificacion_previa_responde_409(monkeypatch):
    """S10: the pre-check keeps rejecting with the documented conflict."""
    repo = FakeUserRepository(existing={"_id": ObjectId(), "email": REGISTER_BODY["email"]})
    service = build_service(monkeypatch, repo)

    with pytest.raises(HTTPException) as error:
        await service.register_user(UserCreate(**REGISTER_BODY))

    assert error.value.status_code == 409
    assert error.value.detail == "Email already exists"
    assert repo.created == []


async def test_duplicate_key_error_al_insertar_responde_409(monkeypatch):
    """S10: the concurrent race is caught and mapped to the same 409."""
    repo = FakeUserRepository(create_error=DuplicateKeyError(DUPLICATE_KEY_MESSAGE))
    service = build_service(monkeypatch, repo)

    with pytest.raises(HTTPException) as error:
        await service.register_user(UserCreate(**REGISTER_BODY))

    assert error.value.status_code == 409
    assert error.value.detail == "Email already exists"
    assert repo.created == []


def test_la_ruta_devuelve_409_cuando_mongo_rechaza_el_email_duplicado(monkeypatch):
    """S10: over HTTP the race surfaces as 409 with the exact detail, not 500."""
    repo = FakeUserRepository(create_error=DuplicateKeyError(DUPLICATE_KEY_MESSAGE))
    app = build_app(monkeypatch, repo)

    response = post_register(app, REGISTER_BODY)

    assert response.status_code == 409
    assert response.json() == {"detail": "Email already exists"}
    assert repo.created == []


def test_la_ruta_existente_sigue_devolviendo_409_si_el_email_ya_existe(monkeypatch):
    """PRESERVE: the pre-check path already returned 409 with this detail."""
    repo = FakeUserRepository(existing={"_id": ObjectId(), "email": REGISTER_BODY["email"]})
    app = build_app(monkeypatch, repo)

    response = post_register(app, REGISTER_BODY)

    assert response.status_code == 409
    assert response.json() == {"detail": "Email already exists"}
    assert repo.created == []


async def test_registro_valido_sigue_creando_el_usuario(monkeypatch):
    """PRESERVE: a fresh email is still hashed, stored and returned."""
    repo = FakeUserRepository()
    service = build_service(monkeypatch, repo)

    created = await service.register_user(UserCreate(**REGISTER_BODY))

    assert created.email == REGISTER_BODY["email"]
    assert created.name == REGISTER_BODY["name"]
    assert created.role == "user"
    assert created.id
    assert len(repo.created) == 1
    stored = repo.created[0]
    assert stored["email"] == REGISTER_BODY["email"]
    assert stored["password"] != REGISTER_BODY["password"]
    assert stored["is_active"] is True
    assert stored["role"] == "user"
    assert stored["token_version"] == 0
