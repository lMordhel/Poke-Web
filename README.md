# 📌 Descripción General

Este proyecto es el frontend de una aplicación web moderna construida en React. Su objetivo principal es brindar una interfaz sólida, dinámica y altamente responsiva tanto para usuarios finales en el entorno público/Dashboard, como para la gestión interna a través de un panel de Administración. La plataforma está estructurada basándose en principios de diseño modular, garantizando un fácil mantenimiento y escalabilidad a largo plazo.

---

# 🧱 Stack Tecnológico

El ecosistema tecnológico ha sido seleccionado bajo criterios de rendimiento, modernidad y estandarización para aplicaciones empresariales:

- **Core**: React 18+ (con APIs modernas, Concurrent Features)
- **Bundler & Build Tool**: Vite (para compilación ultra-rápida y HMR)
- **Lenguaje**: JavaScript (ES6+)
- **Enrutamiento**: React Router DOM v6+
- **Animaciones**: Framer Motion (Optimizado mediante *LazyMotion*)
- **Peticiones HTTP**: Axios / Fetch (Cliente HTTP configurable con soporte de interceptores)
- **Estilos**: Vanilla CSS / CSS Modules (Arquitectura escalable de estilos)
- **Validación y Estilo de Código**: ESLint config, Prettier.

---

# 🏗 Arquitectura del Proyecto

Este frontend se rige bajo una arquitectura sólida orientada al dominio o **Feature-Sliced Architecture**.

- **Arquitectura basada en features**: En lugar de separar monolíticamente todos los hooks por un lado, y los componentes por otro, las funcionalidades clave están "empaquetadas" en módulos propios y autocontenidos.
- **Separación por dominios**: Existen fronteras funcionales claras (Auth, Productos, Dashboard, Admin), lo que previene que la lógica intrincada de diferentes contextos se mezcle.
- **Componentes presentacionales vs contenedores**: Se implementan vistas agnósticas (UI Pura) aisladas y componentes contenedores responsables de proveer estado y lógica; lo que maximiza la reutilización visual y fomenta un código limpio.
- **Modularización de Admin y Dashboard**: Las interfaces de clientes operan en áreas separadas del panel administrativo, evitando recargas innecesarias y conflictos en las entidades de estado.
- **Uso de delegación mediante \`useReducer\`**: Se aplica el patrón *Redux-like* para manejar arquitecturas lógicas locales de alta complejidad, sustituyendo acumulaciones propensas a errores del hook habitual \`useState\`.
- **Optimización de renders**: Estricto uso y conocimiento de estrategias de rendering para no ahogar el *Main Thread* de JavaScript.

---

# 📂 Estructura de Carpetas

La jerarquía del desarrollo fomenta la escalabilidad y está orientada a dominios:

```text
src/
 ├── app/               # Configuración global, enrutamiento (routes.jsx, App.jsx, main.jsx)
 ├── assets/            # Recursos estáticos (imágenes, fuentes, íconos)
 ├── features/          # Dominios de negocio independientes (Feature-Sliced Design)
 │    ├── admin/        # Módulo privado de CRUD del personal administrativo
 │    ├── auth/         # Lógica, estado y UI del login/registro
 │    ├── cart/         # Lógica, estado y UI del carrito de compras
 │    ├── dashboard/    # Interfaz orientada a la navegación de usuario o analítica
 │    ├── home/         # UI y presentación de la página de inicio
 │    └── products/     # Catálogo e interacciones de productos
 │
 ├── lib/               # Librerías y configuraciones de terceros (ej: instancia de axios configurada)
 ├── shared/            # Elementos compartidos transversales
 │    ├── components/   # UI reutilizable genérica (Modales, Navbars, Buttons)
 │    └── styles/       # Variables globales y utilidades CSS
 │
 ├── .env               # Variables de entorno locales
 └── index.css          # Estilos de entrada principal (Entry point CSS)
```

---

# 🔐 Autenticación

- **Flujo Login / Register**: Módulo de autorización con manejo de datos limpios, validación antes de envío para prevenir request innecesarios en la API.
- **Manejo de tokens**: Consumo de identidad persistido usualmente mediante Storage u otro método de transporte. El cliente incluye JWT por interceptores para verificar los perfiles y permisos de usuario en cada petición confidencial.
- **Comunicación con Backend**: Envió de credenciales seguro; el frontend no decodifica roles directamente si no es necesario, permitiendo al backend dominar la seguridad de la información.
- **Protección de rutas**: Componentes interceptores en la capa de *React Router* aseguran que a endpoints internos de \`/admin\` o de la zona de cuenta, sólo pueda enrutarse si el state local verifica sesión válida.

---

# 🔄 Comunicación con Backend

⚠️ **Nota Arquitectónica**: Este repositorio actúa pura y exclusivamente como una capa de presentación y visualización (UI) gestionando estado en un cliente.

- **Consumo de API REST externa**: No posee base de datos local. Todas las operaciones CRUD (Creación, Lectura, Actualización y Borrado) se efectúan de forma remota enviando payloads HTTP a un entorno API ajeno.
- **Separación de Responsabilidades (SoC)**: El frontend se limita a reaccionar a la respuesta de los datos, el backend procesa lógicas pesadas, roles de autorización robustos y persistencia transaccional de datos nativa.
- **Las URLs base se configuran en variables de entorno**: Nunca hardcodeadas. 

Ejemplo estructural de cómo conectarse:
```env
# URL Root del EndPoint de API REST al que se conecta
VITE_API_URL=https://api.tubackend.com
```

---

# ⚙️ Manejo de Estado

El estado de los flujos de la aplicación se fragmenta y elige la mejor herramienta nativa según la magnitud:

- **\`useState\` para estado local simple**: Formularios cortos, modales, alertas locales, y variables de estilo o *toggle* que son unidimensionales y no comparten árbol con terceros.
- **\`useReducer\` para estados complejos**: Ejemplos como el filtrado simultáneo en un catálogo, paginadores multi variables y flujos del carrito en un dashboard, son llevados de manera predecible enviando "actions" a un reductor seguro.
- **Buenas prácticas implementadas**: Inmutabilidad estricta. Ningún objeto anidado o array de productos es alterado directamente para prevenir "silent errors" en el re-render de React.

---

# 🚀 Performance

Se toman varias metodologías para la excelencia técnica y reducción de latencia en la iteración UI:

1. **LazyMotion de Framer Motion**: Carga asíncrona ("lazy load") de la librería Framer Motion reduciendo los \`KBs\` pesados en el First Paint del navegador y priorizando los recursos críticos de interactividad nativa.
2. **Eliminación de index como key**: Se utiliza siempre un identificador único desde las bases de datos externas de la APi (ej. \`product.id\`). Las iteraciones con array index desestabilizaban el árbol del DOM virtual.
3. **Optimización Inline**: Se remueven componentes "anclados al vuelo" de otros *renders* que fuerzan recreaciones totales inútiles previas a las reconciliaciones.
4. **Evitar \`transition: all\`**: Renderizaciones en CPU son apartadas reemplazándolas con atributos del renderizado GPU, para animaciones sin caída masiva de los *FPS*.
5. **Constantes Extraídas**: Arreglos, utilidades estáticas o mappings fuera de las declaraciones principales de react, conservan sus direcciones de memoria durante el ciclo vital.

---

# ♿ Accesibilidad (a11y)

Mejoras destinadas a garantizar el acceso a usuarios múltiples desde dispositivos variados:

- **Asociación correcta label/input**: Todos los campos visuales operables de registro/productos tienen su contraparte ligada por \`id\`, empujando áreas cliqueables seguras.
- **Soporte \`prefers-reduced-motion\`**: Las configuraciones de sistema del dispositivo local prevendrán animaciones descontroladas de "Framer" para la inclusión de usuarios con déficit o irritabilidad visual en general.
- **Navegación por teclado**: Orden de \`TabIndex\` y fluidez para navegar a los modales a fondo sin mouse ni pointer.
- **Roles Semánticos**: Uso de encabezados jerárquicos y especificaciones de `aria-roles` y HTML5 en regiones.

---

# 🛠 Scripts Disponibles

En el contexto del entorno, se proveen los siguientes comandos por medio de npm:

- \`npm run dev\`
  Inicia el servidor local de desarrollo ultra rápido con la configuración de Vite, habilitando auto-refresh de módulos *(HMR)* para la depuración en tiempo real.

- \`npm run build\`
  Ejecuta los procesos del *bundler* construyendo, destilando y compactando los estáticos finales al entorno de producción (en una subcarpeta estática \`/dist\`).

- \`npm run preview\`
  Levanta un servicio de alojamiento *mock* local sobre tu carpeta \`/dist\`. Ideal para simular como luce la web compilada antes de realizar un push oficial al entorno remoto.

---

# 🧪 Calidad y Validaciones

- **Linting**: Políticas estrictas validadas con ESlint garantizan homogenización, eliminación de imports inválidos, variables obsoletas y prevención de bugs visuales/lógicos.
- **Build optimizado**: El compendio minimizado separa *chunks* estratégicamente para servir la APP y las dependencias nativas del sistema, sin desperdicios de red.
- **Buenas prácticas aplicadas**: Se siguen en gran medida pautas comunitarias modernas, tales como el desacople del modelo vistas-controlador simulado, *Clean Code* global y *Fail-fast* en API fetchings.

---

# ▶️ Cómo Ejecutar el Proyecto

Sigue las instrucciones cuidadosamente para configurar tu ambiente local en cuestión de minutos.

**1. Clonar el Repositorio**
```bash
git clone <URL_DEL_REPOSITORIO>
cd <nombre-del-proyecto>
```

**2. Instalar Dependencias**
```bash
npm install
```

**3. Configurar las Variables de Entorno**
Crea tu archivo \`.env\` en el directorio raíz usando las especificaciones (o copiando de \`.env.example\` si aplica) incluyendo variables base para permitir conexiones a la API REST.

Ejemplo:
```bash
VITE_API_URL=http://localhost:8000/api # O tu URL proveída por el equipo backend
```

**4. Levantar entorno dev**
```bash
npm run dev
```

El aplicativo estará corriendo localmente en \`http://localhost:5173\` abierto a validaciones de la interfaz.
