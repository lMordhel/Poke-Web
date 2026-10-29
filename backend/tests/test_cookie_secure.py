"""Cookie flags per environment (S18 of odd/tasks/poke-web-hardening.md).

`secure=False` was hardcoded in every `set_cookie` call, so a production deploy
over HTTPS would ship the session tokens over plaintext too. The flag now comes
from `ENVIRONMENT`: local keeps `http://localhost` working, production demands
HTTPS.
"""

import asyncio

import httpx
from bson import ObjectId

from app.api.v1.endpoints import auth as auth_endpoint
from app.core.config import Settings, settings
from app.core.limiter import limiter
from app.core.security import hash_password
from app.services import auth_service as auth_service_module
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi import FastAPI

USER_ID = "65cde00000000000000000aa"
PASSWORD = "pikachu-123"


class FakeUserRepository:
    def __init__(self, user=None):
        self.user = user

    async def get_by_email(self, email):
        return self.user

    async def get_by_id(self, user_id):
        return self.user

    async def create(self, user_data):
        raise AssertionError("create should not be called")


def active_user():
    return {
        "_id": ObjectId(USER_ID),
        "email": "ash@example.com",
        "password": hash_password(PASSWORD),
        "is_active": True,
        "role": "user",
    }


def build_app(monkeypatch):
    monkeypatch.setattr(auth_service_module, "UserRepository", lambda: FakeUserRepository(active_user()))
    app = FastAPI()
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.include_router(auth_endpoint.router, prefix="/auth")
    return app


def login(app):
    async def call():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.post(
                "/auth/login",
                json={"email": "ash@example.com", "password": PASSWORD},
            )

    return asyncio.run(call())


def build_settings(**overrides):
    """Settings isolated from the developer's .env and OS environment."""
    return Settings(_env_file=None, jwt_secret="test-secret", **overrides)


# --- S18: Secure is derived from the environment --------------------------


def test_entorno_local_no_marca_secure():
    assert build_settings().environment == "local"
    assert build_settings().cookies_secure is False


def test_entorno_production_marca_secure():
    assert build_settings(environment="production").cookies_secure is True


def test_login_local_emite_cookies_httponly_lax_sin_secure(monkeypatch):
    monkeypatch.setattr(settings, "environment", "local")
    response = login(build_app(monkeypatch))

    cookies = response.headers.get_list("set-cookie")
    assert len(cookies) == 2
    for cookie in cookies:
        assert "HttpOnly" in cookie
        assert "SameSite=lax" in cookie
        assert "Secure" not in cookie and "secure" not in cookie


def test_login_en_production_emite_cookies_secure(monkeypatch):
    monkeypatch.setattr(settings, "environment", "production")
    response = login(build_app(monkeypatch))

    cookies = response.headers.get_list("set-cookie")
    assert len(cookies) == 2
    for cookie in cookies:
        assert "Secure" in cookie


# --- PRESERVE -----------------------------------------------------------


def test_logout_sigue_borrando_ambas_cookies(monkeypatch):
    app = build_app(monkeypatch)

    async def call():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.post("/auth/logout")

    response = asyncio.run(call())

    cleared = [
        header.split("=", 1)[0]
        for header in response.headers.get_list("set-cookie")
        if "Max-Age=0" in header
    ]
    assert sorted(cleared) == ["access_token", "refresh_token"]
