"""JWT token types (S11-S12 of odd/tasks/poke-web-hardening.md).

Access and refresh tokens were structurally identical: only the expiry differed.
That let a stolen access token be replayed against /auth/refresh to mint a fresh
30-day refresh token. Each token now declares what it is, and /auth/refresh only
accepts refresh tokens.
"""

import asyncio

import httpx
import pytest
from fastapi import FastAPI
from jose import jwt
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.endpoints import auth as auth_endpoint
from app.core.config import settings
from app.core.limiter import limiter
from app.core.security import ACCESS_TOKEN_TYPE, REFRESH_TOKEN_TYPE, create_token
from app.services import auth_service as auth_service_module


def decode(token):
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])


class FakeUserRepository:
    def __init__(self, user=None):
        self.user = user

    async def get_by_email(self, email):
        return self.user

    async def create(self, user_data):
        raise AssertionError("create should not be called")


def build_app(monkeypatch, repo):
    monkeypatch.setattr(auth_service_module, "UserRepository", lambda: repo)
    app = FastAPI()
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.include_router(auth_endpoint.router, prefix="/auth")
    return app


def post(app, path, cookies=None, json=None):
    async def call():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.post(path, cookies=cookies, json=json)

    return asyncio.run(call())


USER_ID = "65cde00000000000000000aa"


# --- S11: every token declares its type ----------------------------------


def test_access_token_lleva_type_access():
    payload = decode(create_token(USER_ID, 15))

    assert payload["type"] == ACCESS_TOKEN_TYPE == "access"


def test_refresh_token_lleva_type_refresh():
    payload = decode(create_token(USER_ID, 60, REFRESH_TOKEN_TYPE))

    assert payload["type"] == REFRESH_TOKEN_TYPE == "refresh"


# --- S12: /auth/refresh only accepts refresh tokens ----------------------


def test_refresh_rechaza_un_access_token_como_refresh(monkeypatch):
    app = build_app(monkeypatch, FakeUserRepository())
    access_token = create_token(USER_ID, 15)

    response = post(app, "/auth/refresh", cookies={"refresh_token": access_token})

    assert response.status_code == 401
    assert "access_token" not in response.cookies
    assert "refresh_token" not in response.cookies


def test_refresh_acepta_un_refresh_token_valido(monkeypatch):
    app = build_app(monkeypatch, FakeUserRepository())
    refresh_token = create_token(USER_ID, 60, REFRESH_TOKEN_TYPE)

    response = post(app, "/auth/refresh", cookies={"refresh_token": refresh_token})

    assert response.status_code == 200
    assert decode(response.cookies["access_token"])["type"] == ACCESS_TOKEN_TYPE
    assert decode(response.cookies["refresh_token"])["type"] == REFRESH_TOKEN_TYPE


# --- PRESERVE -----------------------------------------------------------


def test_refresh_sin_cookie_sigue_siendo_401(monkeypatch):
    app = build_app(monkeypatch, FakeUserRepository())

    response = post(app, "/auth/refresh")

    assert response.status_code == 401


def test_login_sigue_emitiendo_ambos_tokens_con_su_tipo(monkeypatch):
    from bson import ObjectId

    from app.core.security import hash_password

    repo = FakeUserRepository(
        {
            "_id": ObjectId(USER_ID),
            "email": "ash@example.com",
            "password": hash_password("pikachu-123"),
            "is_active": True,
            "role": "user",
        }
    )
    app = build_app(monkeypatch, repo)

    response = post(
        app,
        "/auth/login",
        json={"email": "ash@example.com", "password": "pikachu-123"},
    )

    assert response.status_code == 200
    assert decode(response.cookies["access_token"])["type"] == ACCESS_TOKEN_TYPE
    assert decode(response.cookies["refresh_token"])["type"] == REFRESH_TOKEN_TYPE
