"""Resolución de precios autoritativos de un pedido.

El cliente solo puede declarar producto, cantidad y talla. Todo lo demás que se
guarda en el pedido (precio, nombre, tipo, imagen y total) se deriva del
catálogo real en MongoDB. Este módulo es lógica pura: no toca la base de datos,
por eso puede probarse sin MongoDB.
"""

from typing import Any, Iterable, Sequence

# Tolerancia en céntimos al comparar el total declarado por el cliente.
MONEY_TOLERANCE = 0.005


class PricingError(ValueError):
    """El pedido no puede resolverse contra el catálogo real."""


def index_products(products: Iterable[dict]) -> dict:
    return {str(product["_id"]): product for product in products}


def _find_variant(product: dict, size: str) -> dict:
    for variant in product.get("variants") or []:
        if variant.get("size") == size:
            return variant
    raise PricingError(
        f"Unknown size '{size}' for {product.get('name', 'product')}"
    )


def resolve_order_items(requested: Sequence[Any], products: Iterable[dict]) -> list:
    """Devuelve los ítems del pedido con los valores que manda el servidor.

    `requested` son objetos con `id`, `quantity` y `size` opcional.
    Lanza PricingError si un producto o una talla no existen, o si el producto
    se vende por variantes y el cliente no eligió talla.
    """
    index = index_products(products)
    items = []

    for request in requested:
        product = index.get(str(request.id))
        if product is None:
            raise PricingError(f"Unknown product: {request.id}")

        variants = product.get("variants") or []
        size = request.size

        if size:
            price = float(_find_variant(product, size)["price"])
        elif variants:
            raise PricingError(
                f"Size is required for {product.get('name', 'product')}"
            )
        elif product.get("price") is None:
            raise PricingError(
                f"Product has no price: {product.get('name', 'product')}"
            )
        else:
            price = float(product["price"])

        items.append(
            {
                "id": str(request.id),
                "name": product.get("name") or "",
                "price": round(price, 2),
                "quantity": int(request.quantity),
                "type": product.get("type") or "",
                "img": product.get("image_url") or product.get("img") or "",
                "size": size,
            }
        )

    return items


def compute_order_total(items: Sequence[dict]) -> float:
    return round(
        sum(float(item["price"]) * int(item["quantity"]) for item in items), 2
    )


def totals_match(declared: float | None, computed: float) -> bool:
    """Un total ausente no es un conflicto: simplemente se usa el del servidor."""
    if declared is None:
        return True
    return abs(round(float(declared), 2) - computed) <= MONEY_TOLERANCE
