"""Pagination and server-side search for the product list (S44-S48).

The catalogue is the only consumer of `GET /products/`, so the shape of that
response is the whole contract the frontend can rely on: which page it got, how
big pages are, how many products match the current filter, and whether asking
for one more page returns anything (S44, S45).

`search` is raw user input typed into a text box, so it is matched as literal
text: a term with `(`, `[`, `*` or a backslash narrows the results instead of
breaking the query (S47). `skip` stays accepted because clients in the wild
still send it, but `page` is the parameter the frontend uses (S44).
"""

import asyncio
import re
from urllib.parse import quote

import httpx
import pytest
from bson import ObjectId
from fastapi import FastAPI

from app.api.v1.endpoints import products as products_endpoint

ROUTE = "/products/"


def build_document(index, name, type_):
    return {
        "_id": ObjectId(f"{index:024x}"),
        "name": name,
        "type": type_,
        "image_url": f"https://cdn.example/{index}.webp",
    }


def build_catalogue():
    """30 products: 20 Electric, 10 Fire, in a stable order."""
    documents = [
        build_document(index, f"Pikachu {index + 1:02d}", "Electric") for index in range(20)
    ]
    documents += [
        build_document(20 + index, f"Charmander {index + 1:02d}", "Fire") for index in range(10)
    ]
    return documents


# --- Fakes with the MongoDB contract the endpoint actually uses -----------


def _matches(document, query):
    """Apply the subset of the Mongo query language the list endpoint emits."""
    if "type" in query and document.get("type") != query["type"]:
        return False
    if "name" in query:
        condition = query["name"]
        flags = re.IGNORECASE if "i" in condition.get("$options", "") else 0
        if re.search(condition["$regex"], document.get("name", ""), flags) is None:
            return False
    return True


class FakeCursor:
    def __init__(self, documents):
        self._documents = list(documents)
        self._iterator = iter(self._documents)

    def sort(self, field, direction=1):
        # Motor sorts before skip/limit; the endpoint relies on a stable order so
        # page 2 cannot repeat or drop a document (S44).
        self._documents = sorted(
            self._documents, key=lambda doc: doc.get(field), reverse=direction < 0
        )
        self._iterator = iter(self._documents)
        return self

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
            return next(self._iterator)
        except StopIteration:
            raise StopAsyncIteration


class FakeProductsCollection:
    def __init__(self, documents):
        self.documents = list(documents)

    def find(self, query):
        return FakeCursor([doc for doc in self.documents if _matches(doc, query)])

    async def count_documents(self, query):
        return sum(1 for doc in self.documents if _matches(doc, query))


class FakeDatabase:
    def __init__(self, documents):
        self.products = FakeProductsCollection(documents)


def build_app(monkeypatch, documents):
    monkeypatch.setattr(products_endpoint, "db", FakeDatabase(documents))
    app = FastAPI()
    app.include_router(products_endpoint.router, prefix="/products")
    return app


def http_call(app, path):
    async def run():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.get(f"{ROUTE}{path}")

    return asyncio.run(run())


# --- S44/S45: the page and its metadata ----------------------------------


def test_a_page_carries_its_position_and_the_matching_total(monkeypatch):
    """S44/S45: page 2 of 12 over 30 products reports where it is."""
    app = build_app(monkeypatch, build_catalogue())

    body = http_call(app, "?page=2&limit=12").json()

    assert len(body["products"]) == 12
    assert body["total"] == 30
    assert body["page"] == 2
    assert body["limit"] == 12
    assert body["pages"] == 3
    assert body["has_more"] is True
    assert body["products"][0]["name"] == "Pikachu 13"


def test_the_total_counts_only_the_filtered_documents(monkeypatch):
    """S45: `total` and `pages` describe the filter, not the whole collection."""
    app = build_app(monkeypatch, build_catalogue())

    body = http_call(app, "?type=Fire&page=1&limit=5").json()

    assert len(body["products"]) == 5
    assert body["total"] == 10
    assert body["pages"] == 2
    assert body["has_more"] is True


def test_the_last_page_reports_that_there_is_nothing_more(monkeypatch):
    """S45: a short last page sets `has_more` to false."""
    app = build_app(monkeypatch, build_catalogue())

    body = http_call(app, "?page=3&limit=12").json()

    assert len(body["products"]) == 6
    assert body["pages"] == 3
    assert body["has_more"] is False


def test_a_page_past_the_end_is_an_empty_page_not_an_error(monkeypatch):
    """S46: asking for page 99 answers 200 with no products, not a 404."""
    app = build_app(monkeypatch, build_catalogue())

    response = http_call(app, "?page=99&limit=12")

    assert response.status_code == 200
    body = response.json()
    assert body["products"] == []
    assert body["total"] == 30
    assert body["page"] == 99
    assert body["has_more"] is False


def test_skip_is_still_translated_into_a_page(monkeypatch):
    """S44: a client sending only `skip` gets the equivalent page."""
    app = build_app(monkeypatch, build_catalogue())

    body = http_call(app, "?skip=12&limit=12").json()

    assert body["page"] == 2
    assert body["products"][0]["name"] == "Pikachu 13"


def test_page_wins_when_both_page_and_skip_are_sent(monkeypatch):
    """S44: `page` is authoritative; `skip` cannot silently override it."""
    app = build_app(monkeypatch, build_catalogue())

    body = http_call(app, "?page=1&skip=24&limit=12").json()

    assert body["page"] == 1
    assert body["products"][0]["name"] == "Pikachu 01"


def test_the_defaults_are_the_first_page_of_fifty(monkeypatch):
    """PRESERVE: callers that send no pagination keep their previous result set."""
    app = build_app(monkeypatch, build_catalogue())

    body = http_call(app, "").json()

    assert body["page"] == 1
    assert body["limit"] == 50
    assert len(body["products"]) == 30
    assert body["total"] == 30
    assert body["has_more"] is False


def test_a_page_below_one_is_rejected(monkeypatch):
    """S44: pages are 1-based; page 0 is a validation error, not page 1."""
    app = build_app(monkeypatch, build_catalogue())

    assert http_call(app, "?page=0").status_code == 422


def test_a_limit_over_one_hundred_is_rejected(monkeypatch):
    """S48: the hard cap stays, and the query never runs."""
    app = build_app(monkeypatch, build_catalogue())

    assert http_call(app, "?limit=101").status_code == 422


# --- S47/S48: search is literal text -------------------------------------


def build_literal_catalogue():
    return [
        build_document(1, "Pikachu (Fire)", "Electric"),
        build_document(2, "Pikachu *star*", "Electric"),
        build_document(3, "Pikachu[1]", "Electric"),
        build_document(4, "Pikachu.Special", "Electric"),
        build_document(5, "Bulbasaur", "Grass"),
    ]


@pytest.mark.parametrize(
    "term,expected",
    [
        ("(Fire)", "Pikachu (Fire)"),
        ("*star*", "Pikachu *star*"),
        ("[1]", "Pikachu[1]"),
        (".Special", "Pikachu.Special"),
        ("pikachu (fire)", "Pikachu (Fire)"),
    ],
)
def test_regex_metacharacters_are_matched_literally(monkeypatch, term, expected):
    """S47: metacharacters narrow the results instead of crashing the query."""
    app = build_app(monkeypatch, build_literal_catalogue())

    response = http_call(app, f"?search={quote(term, safe='')}")

    assert response.status_code == 200
    names = [product["name"] for product in response.json()["products"]]
    assert names == [expected]


def test_search_is_case_insensitive(monkeypatch):
    """S47: typing in lowercase still finds the product."""
    app = build_app(monkeypatch, build_literal_catalogue())

    body = http_call(app, "?search=bulba").json()

    assert [product["name"] for product in body["products"]] == ["Bulbasaur"]


def test_a_blank_search_is_the_same_as_no_search(monkeypatch):
    """S48: spaces in the box do not filter everything out."""
    app = build_app(monkeypatch, build_literal_catalogue())

    body = http_call(app, "?search=%20%20%20").json()

    assert body["total"] == 5


def test_search_and_pagination_combine(monkeypatch):
    """S45/S47: `total` reflects the search and the page slices the matches."""
    app = build_app(monkeypatch, build_catalogue())

    body = http_call(app, "?search=pikachu&page=2&limit=8").json()

    assert body["total"] == 20
    assert body["pages"] == 3
    assert len(body["products"]) == 8
    assert body["products"][0]["name"] == "Pikachu 09"
