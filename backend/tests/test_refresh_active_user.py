"""Refresh tokens require a live account (S13 of odd/tasks/poke-web-hardening.md).

`/auth/refresh` only verified the token signature and its `type` claim, so the
refresh token of a deleted or deactivated account kept minting fresh access
tokens for as long as it was inside its 30-day window. The account behind the
token is now checked, and a stale session is rejected and cleared.
"""

import asyncio

import httpx
from bson import ObjectId
from fastapi import FastAPI
from jose import jwt
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.endpoints import auth as auth_endpoint
from app.core.config import settings
from app.core.limiter import limiter
from app.core.security import REFRESH_TOKEN_TYPE, create_token
from app.services import auth_service as auth_service_module

USER_ID = "65cde00000000000000000aa"


def decode(token):
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])


class FakeUserRepository:
    """Only `get_by_id` matters here: /auth/refresh resolves the account."""

    def __init__(self, user_by_id=None):
        self.user_by_id = user_by_id

    async def get_by_email(self, email):
        raise AssertionError("get_by_email should not be called")

    async def get_by_id(self, user_id):
        return self.user_by_id

    async def create(self, user_data):
        raise AssertionError("create should not be called")


def build_app(monkeypatch, repo):
    monkeypatch.setattr(auth_service_module, "UserRepository", lambda: repo)
    app = FastAPI()
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.include_router(auth_endpoint.router, prefix="/auth")
    return app


def refresh(app, token):
    async def call():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.post("/auth/refresh", cookies={"refresh_token": token})

    return asyncio.run(call())


def cleared_cookie_names(response):
    return [
        header.split("=", 1)[0]
        for header in response.headers.get_list("set-cookie")
        if "Max-Age=0" in header
    ]


def refresh_token():
    return create_token(USER_ID, 60, REFRESH_TOKEN_TYPE)


# --- S13: the account must still exist and be active ---------------------


def test_refresh_de_usuario_borrado_responde_401_y_borra_cookies(monkeypatch):
    app = build_app(monkeypatch, FakeUserRepository(user_by_id=None))

    response = refresh(app, refresh_token())

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid refresh token"
    assert sorted(cleared_cookie_names(response)) == ["access_token", "refresh_token"]
    assert "access_token" not in response.cookies


def test_refresh_de_usuario_inactivo_responde_401_y_borra_cookies(monkeypatch):
    repo = FakeUserRepository(
        user_by_id={"_id": ObjectId(USER_ID), "is_active": False, "role": "user"}
    )
    app = build_app(monkeypatch, repo)

    response = refresh(app, refresh_token())

    assert response.status_code == 401
    assert sorted(cleared_cookie_names(response)) == ["access_token", "refresh_token"]


# --- PRESERVE -----------------------------------------------------------


def test_refresh_de_usuario_activo_sigue_emitiendo_tokens(monkeypatch):
    repo = FakeUserRepository(
        user_by_id={"_id": ObjectId(USER_ID), "is_active": True, "role": "user"}
    )
    app = build_app(monkeypatch, repo)

    response = refresh(app, refresh_token())

    assert response.status_code == 200
    assert decode(response.cookies["access_token"])["type"] == "access"
    assert decode(response.cookies["refresh_token"])["type"] == REFRESH_TOKEN_TYPE


def test_refresh_sin_cookie_sigue_siendo_401(monkeypatch):
    app = build_app(monkeypatch, FakeUserRepository())

    async def call():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.post("/auth/refresh")

    response = asyncio.run(call())

    assert response.status_code == 401
