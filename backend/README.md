# 📌 Descripción General

Este proyecto es el backend de una aplicación web moderna (Web Poke). Su objetivo principal es proveer una API RESTful robusta, rápida e interactiva desarrollada en **Python** empleando el framework asíncrono **FastAPI** y **MongoDB** como base de datos NoSQL. 

Sirve como la capa lógica y de persistencia de datos para el ecosistema completo (Dashboard, E-commerce, Panel Administrativo), asegurando la validación, autorización y disponibilidad de los recursos mediante comunicación HTTP estándar.

---

# 🧱 Stack Tecnológico

El stack del backend ha sido diseñado priorizando la concurrencia asíncrona, validación estricta de datos y la velocidad de desarrollo:

- **Core Framework**: FastAPI (Basado en Starlette y Pydantic)
- **Lenguaje**: Python 3.10+
- **Servidor ASGI**: Uvicorn
- **Base de Datos**: MongoDB (NoSQL)
- **ODM / Driver**: Motor (Driver asíncrono oficial de MongoDB)
- **Validación de Datos**: Pydantic v2 (Esquemas, tipado estricto y serialización)
- **Autenticación**: JWT (JSON Web Tokens) vía `python-jose` y Hashing con `passlib[bcrypt]`
- **Rate Limiting**: `slowapi` (Protección contra abusos y ataques de fuerza bruta)

---

# 🏗 Arquitectura del Proyecto

El backend sigue una arquitectura modular en capas (Layered Architecture), promoviendo la separación de responsabilidades:

- **Routers (`routers/`)**: Define los endpoints HTTP de la API, delegando la lógica de negocio a la capa de servicios. Funciona como el controlador principal.
- **Services (`services/`)**: Contiene la lógica de negocio y casos de uso. Orquesta llamadas a los repositorios o bases de datos sin mezclarse con detalles del protocolo HTTP.
- **Repositories / DAL (`repositories/`)**: Data Access Layer. Se encarga exclusivamente de las interacciones asíncronas directas con MongoDB.
- **Schemas (`schemas/`)**: Modelos de Pydantic para validar los *payloads* de entrada (Requests) y serializar los datos de salida (Responses), asegurando tipado estricto.
- **Core (`core/`)**: Configuraciones globales de la app, dependencias transversales (como el manejo de JWT), middlewares y manejadores de excepciones personalizadas.

---

# 📂 Estructura de Carpetas

La jerarquía del código está optimizada para escalabilidad y mantenimiento:

```text
backend/
 ├── app/                   # Directorio raíz del código fuente
 │    ├── api/              # Ensamblado del enrutador principal (ej: v1)
 │    ├── core/             # Configuración central (settings, security, rate limiter, exceptions)
 │    ├── db/               # Conexión asíncrona a la base de datos (Motor MongoDB)
 │    ├── repositories/     # Patrón repositorio para abstracción de consultas a DB
 │    ├── routers/          # Controladores / Endpoints organizados por entidades (users, products, orders)
 │    ├── schemas/          # Modelos de Pydantic para validación y tipado de DTOs
 │    ├── services/         # Lógica de negocio encapsulada
 │    └── main.py           # Entrypoint de FastAPI (Configuración de middlewares, CORS, init)
 │
 ├── uploads/               # Directorio para archivos estáticos subidos localmente (ej: Imágenes de productos)
 ├── .env                   # Variables de entorno ignoradas en el control de versiones
 ├── README.md              # Documentación técnica
 ├── requirements.txt       # Dependencias declaradas de Python
 └── seed_products.py       # Script utilitario para poblar la DB con datos iniciales
```

---

# 🔐 Autenticación y Autorización

- **JSON Web Tokens (JWT)**: Los usuarios se autentican y reciben un *Access Token* válido por un tiempo definido.
- **Hashing Seguros**: Las contraseñas de los usuarios nunca se guardan en texto plano; se utiliza el algoritmo **Bcrypt** con "salts" aleatorios para protección de credenciales en la DB.
- **Dependencias Inyectadas (DI)**: Se emplea el sistema de DI de FastAPI (`Depends`) en las rutas protegidas para extraer, verificar e inyectar automáticamente al usuario actual autenticado.
- **Roles y Permisos**: El estado del token dicta el nivel de acceso (por ejemplo, validando si un token pertenece a un usuario estándar o a un Administrador para el CRUD de productos).

---

# 🔄 Middleware, CORS y Manejo de Errores

- **CORS (Cross-Origin Resource Sharing)**: Configurado estrictamente en `main.py` para permitir peticiones únicamente desde orígenes de Frontend de confianza (por ejemplo puertos locales de Vite o React).
- **Manejador de Excepciones Global**: Errores nativos (`StarletteHTTPException`), validaciones fallidas de cuerpo (`RequestValidationError`) o abusos de cuota (`RateLimitExceeded`) son capturados de forma centralizada, devolviendo payloads JSON estructurados legibles por el cliente.
- **Rate Limiting**: Restricciones de peticiones por minuto para prevenir ataques DoS básicos o escaneos abusivos (ej: protección en endpoints de Login).

---

# ⚙️ Base de Datos e Índices

- **Motor Asíncrono**: Transmisiones sin bloqueo de hilo (I/O Bound) contra MongoDB, aprovechando todo el potencial del Event Loop de Python.
- **Índices Automatizados**: En el arranque (`@app.on_event("startup")`), FastAPI revisa y construye de manera automática índices críticos (como ordenamiento y *user_id*) en colecciones pesadas como `orders` y `activities` para mantener las lecturas veloces a gran escala.

---

# 🧪 Documentación Automática

Al levantar el entorno, FastAPI expone documentación del ecosistema lista para consumir o compartir con el equipo frontend:

- **Swagger UI** (Interactiva):  [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc** (Referencia estática visual): [http://localhost:8000/redoc](http://localhost:8000/redoc)

Estas interfaces muestran instantáneamente los esquemas exigidos, códigos de error y admiten testeo real sin aplicaciones externas (como Postman).

---

# ▶️ Cómo Ejecutar el Proyecto (Backend)

**1. Navegar al Directorio y Crear Entorno Virtual**
```bash
cd backend
python -m venv .venv
```

**2. Activar Entorno Virtual**
- En **Windows**: 
  ```bash
  .venv\Scripts\activate
  ```
- En macOS/Linux: 
  ```bash
  source .venv/bin/activate
  ```

**3. Instalar Dependencias**
```bash
pip install -r requirements.txt
```

**4. Configurar Variables de Entorno**
Crear el archivo `.env` en base a requerimientos (ejemplo):
```env
MONGODB_URL=mongodb://localhost:27017
SERVER_PORT=8000
JWT_SECRET=tu_clave_secreta_super_segura_super_secreta_mega_secreta_ultra_segura_mega_ultra_secreta 
```

**5. Ejecutar la Aplicación**
```bash
uvicorn app.main:app --reload
```
