"""Máquina de estados de un pedido (S37).

El dashboard ya dibuja cinco estados (`src/features/dashboard/components/
OrdersSection.jsx`): pendiente, procesando, en camino, entregado y cancelado.
Aquí vive la tabla que decide entre cuáles se puede pasar, en un módulo puro
para poder probarla sin base de datos ni HTTP.
"""

ORDER_STATUSES = ("pending", "processing", "shipped", "delivered", "cancelled")

# Un pedido solo avanza un paso, y desde cualquier estado no terminal puede
# cancelarse. `delivered` y `cancelled` cierran el ciclo.
ALLOWED_TRANSITIONS = {
    "pending": ("processing", "cancelled"),
    "processing": ("shipped", "cancelled"),
    "shipped": ("delivered", "cancelled"),
    "delivered": (),
    "cancelled": (),
}


class OrderStatusError(ValueError):
    """La transición pedida no está en la tabla."""


def ensure_transition(current: str, target: str) -> None:
    """Lanza `OrderStatusError` si `current → target` no está permitida."""
    allowed = ALLOWED_TRANSITIONS.get(current, ())
    if target in allowed:
        return

    destino = ", ".join(allowed) if allowed else "ningún estado"
    raise OrderStatusError(
        f"No puedes pasar de {current} a {target}; desde {current} solo se puede "
        f"pasar a: {destino}."
    )
