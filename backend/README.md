# Backend FastAPI + MongoDB (Refactored)

Backend en FastAPI modularizado siguiendo principios de arquitectura limpia (Clean Architecture) y mejores prácticas, adaptado para MongoDB.

## Requisitos
- Python 3.10+
- MongoDB en ejecución (local o Atlas).
- `pip` y `virtualenv`.

## Setup rápido
```bash
# 1) Crear entorno
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate

# 2) Instalar dependencias
pip install -r requirements.txt

# 3) Variables de entorno
copy .env.example .env
```

## Estructura del Proyecto
El proyecto ha sido refactorizado para seguir una estructura escalable:

```
backend/
├─ app/
│  ├─ api/
│  │  └─ v1/
│  │     ├─ api.py             # Router principal de la API V1
│  │     └─ endpoints/         # Endpoints agrupados por dominio
│  │        ├─ auth.py
│  │        └─ products.py
│  ├─ core/                    # Configuración central y seguridad
│  │  ├─ config.py             # Variables de entorno con Pydantic Settings
│  │  └─ security.py           # Utilidades JWT y Hashing
│  ├─ db/
│  │  └─ db.py                 # Conexión a MongoDB (Motor)
│  ├─ schemas/                 # Modelos Pydantic (Validación y Serialización)
│  │  ├─ user.py
│  │  ├─ product.py
│  │  └─ token.py
│  └─ main.py                  # Entrypoint de la aplicación
└─ requirements.txt
```

## Ejecutar en local
```bash
uvicorn app.main:app --reload --port 8000
```

## Endpoints Principales (V1)
- `POST /api/v1/auth/register`: Registro de usuarios
- `POST /api/v1/auth/login`: Inicio de sesión (JWT)
- `GET /api/v1/products`: Listado de productos (paginado)

## Notas de Implementación
- **MongoDB**: Se utiliza `motor` para operaciones asíncronas.
- **Pydantic V2**: Modelos actualizados a la versión 2 para mayor rendimiento y validación.
- **Seguridad**: Implementación de JWT con Access/Refresh tokens y hashing con bcrypt.
