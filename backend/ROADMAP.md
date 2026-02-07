# Roadmap de Estudio: Backend FastAPI + MongoDB

Este documento es una guía paso a paso para entender cómo está construido este backend profesional. Sigue el orden sugerido para construir tu conocimiento capa por capa.

---

## 🗺️ Mapa de Ruta (Study Path)

### 1. Fundamentos y Configuración
Empieza por entender cómo arranca la aplicación y cómo se configura.

- **`app/main.py`**: El punto de entrada.
  - *Qué mirar*: Cómo se inicia `FastAPI`, cómo se configura `CORS` (crucial para que el frontend funcione) y cómo se montan las rutas con `include_router`.
- **`app/core/config.py`**: La configuración centralizada.
  - *Qué mirar*: Uso de `Pydantic BaseSettings` para leer variables de entorno (`.env`) de forma tipada y segura.

### 2. Base de Datos (La Capa de Persistencia)
Entiende cómo nos conectamos a los datos.

- **`app/db/database.py`**: La conexión.
  - *Qué mirar*: Cómo usamos `motor` (driver asíncrono) en lugar de `pymongo` para no bloquear el servidor.

### 3. Modelos de Datos (Schemas)
Antes de procesar datos, definimos su forma.

- **`app/schemas/user.py`** y **`product.py`**:
  - *Qué mirar*: La diferencia entre modelos de entrada (`Create`, `Login`) y modelos de salida (`Out`). Fíjate en cómo Pydantic valida tipos automáticamente (ej: `EmailStr`).

### 4. Seguridad y Autenticación (El Núcleo Crítico)
Aquí está la magia de proteger tu API.

- **`app/core/security.py`**: Herramientas de seguridad.
  - *Qué mirar*:
    - `hash_password`: Por qué usamos `bcrypt` y no `md5`.
    - `create_token`: Cómo se firman los JWT.
    - `get_current_user`: **La pieza más importante**. Entiende cómo esta función intercepta cada petición, extrae el token, lo valida y te devuelve el usuario.

### 5. API y Lógica de Negocio (Endpoints)
Donde ocurre la acción real.

- **`app/api/v1/endpoints/auth.py`**:
  - *Qué mirar*: Cómo `/login` genera tokens y cómo `/me` usa la dependencia `get_current_user` para protegerse.
- **`app/api/v1/endpoints/products.py`**:
  - *Qué mirar*: Cómo se hacen consultas a MongoDB (`find`, `skip`, `limit`) y cómo se transforman los datos de BSON (Mongo) a JSON (Pydantic).

---

## 🧪 Pruebas Sugeridas (Manos a la obra)

Para afianzar conocimientos, intenta hacer esto:

1.  **Swagger UI**: Ve a `http://localhost:8000/docs`. Es tu mejor amigo. Interactúa con la API sin escribir código.
2.  **Breakpoints**: Pon un `print()` dentro de `get_current_user` en `security.py` y haz una petición a `/me`. Verás cómo se ejecuta en tiempo real.
3.  **Nuevo Endpoint**: Intenta crear una ruta simple. Ej: `/products/featured` que devuelva solo los productos marcados como `is_new=True`.

## 📚 Conceptos Clave a Investigar
Si ves términos que no conoces, busca esto en Google/ChatGPT:
- "FastAPI Dependency Injection"
- "JWT Authentication Flow"
- "Asynchronous Python (async/await)"
- "MongoDB BSON vs JSON"
- "Pydantic V2 Validation"

¡Buena suerte en tu aprendizaje! 🚀
