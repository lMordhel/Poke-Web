"""Public origin of uploaded images (S34 of odd/tasks/poke-web-hardening.md).

`POST /products/upload-image` builds the absolute `url` it returns. It used to
build it with a hardcoded `http://localhost:8000`, so every environment that was
not the developer machine advertised the wrong origin and the browser could not
load the image. The origin now comes from `PUBLIC_BASE_URL`.
"""

import asyncio

import httpx
from fastapi import FastAPI

from app.api.v1.endpoints import products as products_endpoint
from app.core.config import Settings, settings
from app.core.security import get_current_admin_user

ADMIN_ID = "65cde00000000000000000aa"
UPLOAD_PATH = "/products/upload-image"

# Smallest valid PNG: enough for an `image/png` upload.
PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x00IEND\xaeB`\x82"
)


# --- The rule: the base is configuration, not a literal -------------------


def test_upload_url_uses_the_configured_public_base_url():
    """S34: `PUBLIC_BASE_URL` decides the origin of the returned URL."""
    configured = Settings(
        _env_file=None,
        jwt_secret="test-secret",
        public_base_url="https://api.poke.example",
    )

    assert configured.upload_url("abc.png") == "https://api.poke.example/uploads/abc.png"


def test_upload_url_defaults_to_localhost_8000():
    """S34: the default keeps the local development flow unchanged."""
    configured = Settings(_env_file=None, jwt_secret="test-secret")

    assert configured.upload_url("abc.png") == "http://localhost:8000/uploads/abc.png"


def test_upload_url_normalises_a_trailing_slash():
    """S34: a base with a trailing slash must not produce `//uploads`."""
    configured = Settings(
        _env_file=None,
        jwt_secret="test-secret",
        public_base_url="https://api.poke.example/",
    )

    assert configured.upload_url("abc.png") == "https://api.poke.example/uploads/abc.png"


# --- The endpoint actually uses it ---------------------------------------


async def post_image(app):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post(
            UPLOAD_PATH,
            files={"file": ("poke.png", PNG_BYTES, "image/png")},
        )


def test_upload_endpoint_returns_the_configured_origin(monkeypatch, tmp_path):
    """S34: the endpoint wires the configured base into its response."""
    # `uploads/` is relative to the process cwd: keep the repository clean.
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(settings, "public_base_url", "https://cdn.poke.example")

    app = FastAPI()
    app.include_router(products_endpoint.router, prefix="/products")
    app.dependency_overrides[get_current_admin_user] = lambda: {
        "id": ADMIN_ID,
        "role": "admin",
    }

    response = asyncio.run(post_image(app))

    assert response.status_code == 201, response.text
    url = response.json()["url"]
    assert url.startswith("https://cdn.poke.example/uploads/"), url
    assert url.endswith(".png"), url

    written = list((tmp_path / "uploads").iterdir())
    assert len(written) == 1
    assert written[0].name in url
