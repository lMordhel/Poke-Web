from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

# --- Esquemas de pedidos ---
# Regla central: el cliente SOLO puede pedir producto, cantidad y talla.
# El precio, el nombre, el tipo, la imagen y el total los decide el servidor
# a partir del catálogo real en MongoDB (ver app/services/pricing.py).


class OrderItemCreate(BaseModel):
    """Lo único que el cliente tiene permitido declarar de un ítem."""

    id: str = Field(description="Product ID")
    quantity: int = Field(ge=1, description="Cantidad, mínimo 1")
    size: Optional[str] = Field(default=None, description="Talla/variante seleccionada")


class OrderItem(BaseModel):
    """Ítem tal como queda guardado: valores resueltos por el servidor."""

    id: str = Field(description="Product ID")
    name: str
    price: float
    quantity: int
    type: str
    img: str
    size: Optional[str] = None


class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Cart items cannot be empty")
    # Se acepta para detectar carritos desactualizados, nunca como fuente de verdad.
    total: Optional[float] = Field(default=None, ge=0)


class OrderOut(BaseModel):
    id: str
    user_id: str
    items: List[OrderItem]
    total: float
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
