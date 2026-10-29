"""Rich text sanitisation for `long_description` (S14-S15 of odd/tasks/poke-web-hardening.md).

`ProductDetail.jsx` renders `product.long_description` with
`dangerouslySetInnerHTML`, so every stored byte of HTML is executable markup.
Rich text is intentionally kept (it is not flattened to plain text): the server
cleans it against a tight allowlist when a product is written (S14) and again
when a product detail is read, so rows written before this change are covered
too (S15).
"""

import asyncio

import httpx
from bson import ObjectId
from fastapi import FastAPI

from app.api.v1.endpoints import products as products_endpoint
from app.core.sanitize import sanitize_rich_text
from app.core.security import get_current_admin_user
from app.schemas.product import ProductCreate, ProductUpdate

# A real 24-character ObjectId hex string, so `ObjectId.is_valid` accepts it.
PRODUCT_ID = "65cde" + "0" * 18 + "5"
ADMIN_ID = "65cde00000000000000000aa"

LEGACY_DIRTY = (
    '<h3>Tamaños</h3><p onclick="alert(1)">20cm y 35cm</p>'
    '<script>alert("xss")</script>'
    '<img src="https://evil.example/x.png" onerror="alert(1)">'
    '<a href="javascript:alert(1)">click</a>'
)

CREATE_BODY = {
    "name": "Pikachu Plush",
    "type": "Electric",
    "image_url": "https://cdn.example/pikachu.webp",
    "short_description": "Soft plush",
    "long_description": LEGACY_DIRTY,
}

UPDATE_BODY = {
    "name": "Pikachu Plush XL",
    "type": "Electric",
    "image_url": "https://cdn.example/pikachu-xl.webp",
    "long_description": LEGACY_DIRTY,
}

CLEAN_RICH_TEXT = '<p>Tamaños disponibles: <strong>20cm</strong>, <em>35cm</em></p>'


def assert_no_dangerous_markup(value):
    """Every dangerous construct of the fixture is gone, prose survives."""
    assert value is not None
    lowered = value.lower()
    assert "<script" not in lowered
    assert "alert(" not in lowered
    assert "onerror" not in lowered
    assert "onclick" not in lowered
    assert "javascript:" not in lowered
    assert "<img" not in lowered
    assert "<iframe" not in lowered
    assert "20cm y 35cm" in value


# --- The pure function: allowlist, not blacklist --------------------------


def test_allowed_markup_is_preserved_exactly():
    """S14: the allowlisted rich text is kept as the author wrote it."""
    assert sanitize_rich_text("<p>Hola <strong>mundo</strong> y <em>todos</em></p>") == (
        "<p>Hola <strong>mundo</strong> y <em>todos</em></p>"
    )


def test_allowlisted_formatting_tags_survive():
    """S14: the whole formatting allowlist survives, not just paragraphs."""
    for snippet in (
        "<b>bold</b>",
        "<i>italic</i>",
        "<u>underline</u>",
        "<s>strike</s>",
        "<h3>title</h3>",
        "<h4>subtitle</h4>",
        "<h5>small title</h5>",
        "<blockquote>quote</blockquote>",
        "<ul><li>one</li></ul>",
        "<ol><li>one</li></ol>",
        "<p>a<br>b</p>",
        "<table><thead><tr><th>h</th></tr></thead><tbody><tr><td>c</td></tr></tbody></table>",
    ):
        assert sanitize_rich_text(snippet) == snippet


def test_script_tag_and_its_content_are_removed():
    """S14: `<script>` never reaches the client, not even as escaped text."""
    cleaned = sanitize_rich_text("<p>ok</p><script>alert(1)</script>")

    assert cleaned == "<p>ok</p>"


def test_style_tag_and_its_content_are_removed():
    """S14: inline stylesheets are dropped with their content."""
    cleaned = sanitize_rich_text("<style>p{color:red}</style><p>ok</p>")

    assert "<style" not in cleaned.lower()
    assert "color:red" not in cleaned
    assert "<p>ok</p>" in cleaned


def test_img_and_iframe_are_removed_with_their_event_handlers():
    """S14: tags outside the allowlist disappear, `on*` attributes included."""
    cleaned = sanitize_rich_text(
        '<img src="https://evil.example/x.png" onerror="alert(1)">'
        '<iframe src="https://evil.example"></iframe>'
        "<p>ok</p>"
    )

    assert "<img" not in cleaned.lower()
    assert "<iframe" not in cleaned.lower()
    assert "onerror" not in cleaned.lower()
    assert cleaned == "<p>ok</p>"


def test_event_handler_attributes_are_removed_from_allowed_tags():
    """S14: an allowed tag with `onclick` keeps the tag and loses the attribute."""
    cleaned = sanitize_rich_text('<p onclick="alert(1)">ok</p>')

    assert cleaned == "<p>ok</p>"


def test_styling_and_data_attributes_are_removed():
    """S14: no styling hooks, no data/aria attributes - allowlist only."""
    cleaned = sanitize_rich_text('<p class="hero" style="color:red" data-id="1">ok</p>')

    assert cleaned == "<p>ok</p>"


def test_javascript_url_is_rejected():
    """S14: `javascript:` links are neutralised, the label survives."""
    cleaned = sanitize_rich_text('<a href="javascript:alert(1)">click</a>')

    assert "javascript" not in cleaned.lower()
    assert "click" in cleaned


def test_http_and_mailto_links_are_kept_with_href_and_title():
    """S14: the documented URL schemes and `a` attributes stay allowed."""
    https_link = sanitize_rich_text('<a href="https://example.com" title="Example">x</a>')
    mailto_link = sanitize_rich_text('<a href="mailto:ash@example.com">mail</a>')

    assert 'href="https://example.com"' in https_link
    assert 'title="Example"' in https_link
    assert 'href="mailto:ash@example.com"' in mailto_link


def test_other_url_schemes_are_rejected():
    """S14: only http, https and mailto are allowed schemes."""
    cleaned = sanitize_rich_text('<a href="ftp://example.com/file">x</a>')

    assert "ftp:" not in cleaned.lower()


def test_none_and_empty_values_are_returned_unchanged():
    """S14: an absent description stays absent instead of becoming a string."""
    assert sanitize_rich_text(None) is None
    assert sanitize_rich_text("") == ""


def test_sanitising_is_idempotent():
    """S15: cleaning an already-clean payload changes nothing."""
    once = sanitize_rich_text(LEGACY_DIRTY)

    assert sanitize_rich_text(once) == once


def test_the_full_dirty_payload_is_cleaned():
    """S14/S15: the hostile fixture keeps its prose and loses its payload."""
    cleaned = sanitize_rich_text(LEGACY_DIRTY)

    assert_no_dangerous_markup(cleaned)
    assert "<h3>Tamaños</h3>" in cleaned


# --- S14: writes store sanitised HTML ------------------------------------


def test_create_schema_sanitises_long_description():
    """S14: what a create request stores is already sanitised."""
    model = ProductCreate(**CREATE_BODY)

    assert model.long_description is not None
    assert_no_dangerous_markup(model.long_description)


def test_create_schema_dump_is_sanitised():
    """S14: `model_dump()` - the dict MongoDB receives - is sanitised."""
    dumped = ProductCreate(**CREATE_BODY).model_dump()

    assert_no_dangerous_markup(dumped["long_description"])


def test_create_schema_keeps_clean_rich_text_untouched():
    """PRESERVE: legitimate rich text is stored byte for byte."""
    payload = dict(CREATE_BODY, long_description=CLEAN_RICH_TEXT)

    dumped = ProductCreate(**payload).model_dump()

    assert dumped["long_description"] == CLEAN_RICH_TEXT


def test_create_schema_keeps_long_description_absent():
    """PRESERVE: omitting the field still stores `None`, not an empty string."""
    payload = {key: value for key, value in CREATE_BODY.items() if key != "long_description"}

    assert ProductCreate(**payload).model_dump()["long_description"] is None


def test_update_schema_sanitises_long_description():
    """S14: the partial-update schema sanitises the same field."""
    model = ProductUpdate(long_description=LEGACY_DIRTY)

    assert model.long_description is not None
    assert_no_dangerous_markup(model.long_description)


def test_update_schema_leaves_untouched_fields_alone():
    """PRESERVE: a partial update without the field does not invent one."""
    dumped = ProductUpdate(name="Pikachu Plush").model_dump(exclude_unset=True)

    assert dumped == {"name": "Pikachu Plush"}


# --- Endpoint coverage: fakes instead of MongoDB --------------------------


class FakeInsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class FakeUpdateResult:
    def __init__(self, matched_count):
        self.matched_count = matched_count


class FakeCursor:
    """Async iterator mirroring the Motor cursor used by the list endpoint."""

    def __init__(self, documents):
        self._documents = list(documents)
        self._iterator = iter(self._documents)

    def skip(self, count):
        self._documents = self._documents[count:]
        self._iterator = iter(self._documents)
        return self

    def limit(self, count):
        self._documents = self._documents[:count]
        self._iterator = iter(self._documents)
        return self

    def __aiter__(self):
        return self

    async def __anext__(self):
        try:
            return dict(next(self._iterator))
        except StopIteration:
            raise StopAsyncIteration


def _matches(document, query):
    for key, expected in query.items():
        if isinstance(expected, dict) and "$ne" in expected:
            if document.get(key) == expected["$ne"]:
                return False
        elif document.get(key) != expected:
            return False
    return True


class FakeProductsCollection:
    """In-memory `products` collection: no MongoDB server required."""

    def __init__(self, documents=None):
        self.documents = [dict(document) for document in (documents or [])]
        self.inserted = []
        self.updates = []

    async def find_one(self, query):
        for document in self.documents:
            if _matches(document, query):
                return dict(document)
        return None

    async def count_documents(self, query):
        return sum(1 for document in self.documents if _matches(document, query))

    def find(self, query):
        return FakeCursor([dict(d) for d in self.documents if _matches(d, query)])

    async def insert_one(self, document):
        stored = dict(document)
        stored.setdefault("_id", ObjectId())
        self.documents.append(stored)
        self.inserted.append(dict(stored))
        return FakeInsertResult(stored["_id"])

    async def update_one(self, query, update):
        changed = update.get("$set", {})
        matched = 0
        for document in self.documents:
            if _matches(document, query):
                matched += 1
                document.update(changed)
                self.updates.append(dict(changed))
        return FakeUpdateResult(matched)


class FakeDatabase:
    def __init__(self, products):
        self.products = products


def build_app(monkeypatch, products):
    """Real products router with a fake database and a fake admin session."""
    monkeypatch.setattr(products_endpoint, "db", FakeDatabase(products))
    app = FastAPI()
    app.include_router(products_endpoint.router, prefix="/products")
    app.dependency_overrides[get_current_admin_user] = lambda: {
        "id": ADMIN_ID,
        "role": "admin",
    }
    return app


def call(app, method, path, json=None):
    async def run():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.request(method, path, json=json)

    return asyncio.run(run())


def test_creating_a_product_stores_sanitised_html(monkeypatch):
    """S14: POST stores the sanitised value and echoes it back sanitised."""
    products = FakeProductsCollection()
    app = build_app(monkeypatch, products)

    response = call(app, "POST", "/products/", json=CREATE_BODY)

    assert response.status_code == 201
    assert_no_dangerous_markup(response.json()["long_description"])
    assert len(products.inserted) == 1
    assert_no_dangerous_markup(products.inserted[0]["long_description"])


def test_creating_a_product_keeps_clean_rich_text(monkeypatch):
    """PRESERVE: a legitimate rich description is stored unchanged."""
    products = FakeProductsCollection()
    app = build_app(monkeypatch, products)
    body = dict(CREATE_BODY, long_description=CLEAN_RICH_TEXT)

    response = call(app, "POST", "/products/", json=body)

    assert response.status_code == 201
    assert products.inserted[0]["long_description"] == CLEAN_RICH_TEXT


def test_updating_a_product_stores_sanitised_html(monkeypatch):
    """S14: PUT stores the sanitised value in the `$set` document."""
    products = FakeProductsCollection(
        [
            {
                "_id": ObjectId(PRODUCT_ID),
                "name": "Pikachu Plush",
                "slug": "pikachu-plush",
                "long_description": "<p>old</p>",
            }
        ]
    )
    app = build_app(monkeypatch, products)

    response = call(app, "PUT", f"/products/{PRODUCT_ID}", json=UPDATE_BODY)

    assert response.status_code == 200
    assert_no_dangerous_markup(response.json()["long_description"])
    assert len(products.updates) == 1
    assert_no_dangerous_markup(products.updates[0]["long_description"])


def test_updating_without_long_description_keeps_the_stored_one(monkeypatch):
    """PRESERVE: a partial update does not clear the existing description."""
    products = FakeProductsCollection(
        [
            {
                "_id": ObjectId(PRODUCT_ID),
                "name": "Pikachu Plush",
                "slug": "pikachu-plush",
                "long_description": CLEAN_RICH_TEXT,
            }
        ]
    )
    app = build_app(monkeypatch, products)
    body = {
        "name": "Pikachu Plush XL",
        "type": "Electric",
        "image_url": "https://cdn.example/pikachu-xl.webp",
    }

    response = call(app, "PUT", f"/products/{PRODUCT_ID}", json=body)

    assert response.status_code == 200
    assert "long_description" not in products.updates[0]
    assert products.documents[0]["long_description"] == CLEAN_RICH_TEXT


def test_product_detail_by_id_sanitises_legacy_html(monkeypatch):
    """S15: a dirty row written before this change is cleaned on read."""
    legacy = {
        "_id": ObjectId(PRODUCT_ID),
        "name": "Pikachu Plush",
        "slug": "pikachu-plush",
        "type": "Electric",
        "image_url": "https://cdn.example/pikachu.webp",
        "long_description": LEGACY_DIRTY,
    }
    products = FakeProductsCollection([legacy])
    app = build_app(monkeypatch, products)

    response = call(app, "GET", f"/products/{PRODUCT_ID}")

    assert response.status_code == 200
    assert_no_dangerous_markup(response.json()["long_description"])
    assert products.documents[0]["long_description"] == LEGACY_DIRTY


def test_product_detail_by_slug_sanitises_legacy_html(monkeypatch):
    """S15: the slug route is the one the frontend uses - it must clean too."""
    legacy = {
        "_id": ObjectId(PRODUCT_ID),
        "name": "Pikachu Plush",
        "slug": "pikachu-plush",
        "type": "Electric",
        "image_url": "https://cdn.example/pikachu.webp",
        "long_description": LEGACY_DIRTY,
    }
    products = FakeProductsCollection([legacy])
    app = build_app(monkeypatch, products)

    response = call(app, "GET", "/products/slug/pikachu-plush")

    assert response.status_code == 200
    assert_no_dangerous_markup(response.json()["long_description"])


def test_product_detail_keeps_clean_rich_text(monkeypatch):
    """PRESERVE: cleaning on read does not alter an already-clean description."""
    stored = {
        "_id": ObjectId(PRODUCT_ID),
        "name": "Pikachu Plush",
        "slug": "pikachu-plush",
        "type": "Electric",
        "image_url": "https://cdn.example/pikachu.webp",
        "long_description": CLEAN_RICH_TEXT,
    }
    products = FakeProductsCollection([stored])
    app = build_app(monkeypatch, products)

    response = call(app, "GET", f"/products/{PRODUCT_ID}")

    assert response.status_code == 200
    assert response.json()["long_description"] == CLEAN_RICH_TEXT


def test_product_list_is_untouched(monkeypatch):
    """PRESERVE: the list endpoint is not rendered as HTML and keeps its shape."""
    stored = {
        "_id": ObjectId(PRODUCT_ID),
        "name": "Pikachu Plush",
        "slug": "pikachu-plush",
        "type": "Electric",
        "image_url": "https://cdn.example/pikachu.webp",
        "long_description": LEGACY_DIRTY,
    }
    products = FakeProductsCollection([stored])
    app = build_app(monkeypatch, products)

    response = call(app, "GET", "/products/")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert [product["name"] for product in body["products"]] == ["Pikachu Plush"]
