"""CORS policy (S17 of odd/tasks/poke-web-hardening.md).

The middleware used to trust any `https://*.vercel.app` origin through a regex,
so any preview deployment - or any attacker-owned project on that domain - could
call the API with credentials. The allowlist is now explicit, declared in
configuration, with no pattern wildcard at all.
"""

import asyncio

import httpx

from app.core.config import Settings, settings
from app.main import app

PREFLIGHT_HEADERS = {
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type",
}
LOGIN_PATH = "/api/v1/auth/login"


def preflight(origin):
    async def call():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.options(
                LOGIN_PATH,
                headers={**PREFLIGHT_HEADERS, "Origin": origin},
            )

    return asyncio.run(call())


def build_settings(**overrides):
    """Settings isolated from the developer's .env and OS environment."""
    return Settings(_env_file=None, jwt_secret="test-secret", **overrides)


# --- S17: no pattern wildcard, unlisted origins get nothing ---------------


def test_origen_vercel_no_listado_no_recibe_cabecera_cors():
    response = preflight("https://proyecto-ajeno.vercel.app")

    assert "access-control-allow-origin" not in response.headers


def test_origen_fuera_de_la_lista_no_recibe_cabecera_cors():
    response = preflight("https://evil.example.com")

    assert "access-control-allow-origin" not in response.headers


def test_origen_local_listado_sigue_permitido_con_credenciales():
    response = preflight("http://localhost:5173")

    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert response.headers["access-control-allow-credentials"] == "true"


def test_cors_origins_se_declara_como_lista_explicita_en_configuracion():
    custom = build_settings(cors_origins="https://a.example, https://b.example")

    assert custom.cors_allow_origins == ["https://a.example", "https://b.example"]


def test_origenes_por_defecto_son_solo_locales_y_sin_comodines():
    origins = settings.cors_allow_origins

    assert origins
    assert all(origin.startswith(("http://localhost", "http://127.0.0.1")) for origin in origins)
    assert not any("*" in origin for origin in origins)
