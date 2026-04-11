# La Cuponera — Arquitectura del Proyecto

---

## 1. Descripción general

**La Cuponera** es una plataforma web de cupones y descuentos que conecta comercios con clientes finales. Las empresas publican ofertas, el administrador las revisa y aprueba, y los clientes las compran obteniendo cupones digitales que luego canjean en el local.

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | React | 19 |
| Estilos | Tailwind CSS | v4 |
| Estado global | Zustand | — |
| HTTP cliente | Axios | — |
| Routing frontend | React Router | v7 |
| Backend / API | Laravel | 11 |
| Autenticación API | Laravel Sanctum | — |
| Base de datos | PostgreSQL | — |
| Servidor local | Laravel Herd | — |
| Build frontend | Vite | — |

---

## 3. Arquitectura general

El proyecto sigue el patrón **SPA + REST API**:

```
┌─────────────────────────────────┐        ┌──────────────────────────────────┐
│          FRONTEND (React)       │        │        BACKEND (Laravel)         │
│                                 │        │                                  │
│  Vite dev server (puerto 5173)  │◄──────►│  Laravel Herd (puerto 8000)      │
│                                 │  HTTP  │                                  │
│  - Zustand (estado global)      │  JSON  │  - Sanctum (tokens de sesión)    │
│  - React Router (navegación)    │        │  - Eloquent ORM (base de datos)  │
│  - Axios (peticiones HTTP)      │        │  - PostgreSQL                    │
└─────────────────────────────────┘        └──────────────────────────────────┘
```

El frontend nunca toca la base de datos directamente. Toda la lógica de negocio vive en el backend. El frontend solo consume la API REST con JSON.

---

## 4. Diseño de la base de datos

### Diagrama de entidades

```
users
 ├── clients          (datos personales del cliente: DUI, teléfono, dirección)
 └── employees        (vincula empleado o company_admin a una empresa)

categories
 └── companies        (cada empresa pertenece a una categoría/rubro)
      └── offers       (ofertas publicadas por la empresa)
           └── coupons (cupones generados al comprar una oferta)
                └── purchases (registro de compra del cliente)
```

### Tablas principales

#### `users`
| Campo | Tipo | Descripción |
|---|---|---|
| id | bigint PK | — |
| name | varchar | Nombre de display |
| email | varchar | Login |
| password | varchar | Hash bcrypt |
| role | varchar | `admin`, `client`, `company_admin`, `employee` |

#### `clients`
| Campo | Tipo | Descripción |
|---|---|---|
| user_id | FK → users | Relación 1:1 con user |
| first_name, last_name | varchar | — |
| phone | varchar | 8 dígitos |
| address | varchar | — |
| dui | varchar | Documento único de identidad |

#### `employees`
| Campo | Tipo | Descripción |
|---|---|---|
| user_id | FK → users | Relación 1:1 con user |
| company_id | FK → companies | Empresa a la que pertenece |
| position | varchar | Cargo (ej. Cajero) |

> Tanto `employee` como `company_admin` tienen registro en esta tabla. Así el sistema sabe a qué empresa pertenecen para restringir el canje de cupones.

#### `categories`
| Campo | Tipo | Descripción |
|---|---|---|
| id, name | — | Rubros: Gastronomía, Tecnología, etc. |

#### `companies`
| Campo | Tipo | Descripción |
|---|---|---|
| category_id | FK → categories | Rubro al que pertenece |
| name, code | varchar | El `code` se usa como prefijo de cupones |
| description, address | varchar | — |

#### `offers`
| Campo | Tipo | Descripción |
|---|---|---|
| company_id | FK → companies | — |
| title | varchar | Nombre de la oferta |
| regular_price | decimal | Precio original |
| offer_price | decimal | Precio con descuento |
| start_date | datetime | Desde cuándo se puede comprar |
| end_date | datetime | Hasta cuándo se puede comprar |
| limit_date | datetime | Fecha de vencimiento del cupón |
| coupon_limit | integer | Stock total (null = ilimitado) |
| coupon_per_user_limit | integer | Límite de compra por cliente (null = sin límite) |
| status | varchar | `Pendiente`, `Aprobada`, `Rechazada` |
| image_url | varchar | URL externa o path de storage local |

#### `purchases`
| Campo | Tipo | Descripción |
|---|---|---|
| client_id | FK → clients | Cliente que compró |
| total_amount | decimal | Total de la compra |

#### `coupons`
| Campo | Tipo | Descripción |
|---|---|---|
| offer_id | FK → offers | — |
| purchase_id | FK → purchases | — |
| code | varchar | Código único (ej. ABC01234567) |
| status | varchar | `available`, `redeemed`, `expired` |
| expiration_date | datetime | Fecha de vencimiento |

---

## 5. Sistema de roles

El sistema tiene 4 roles. Cada uno tiene acceso a rutas y vistas distintas.

```
┌─────────────────────────────────────────────────────────┐
│ ADMIN                                                   │
│  • Dashboard con estadísticas                           │
│  • CRUD de categorías, empresas, empleados              │
│  • Aprobación / rechazo de ofertas                      │
│  • Vista global de todos los cupones                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ COMPANY_ADMIN                                           │
│  • CRUD de sus propias ofertas                          │
│  • Canjear cupones de su empresa                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ EMPLOYEE                                                │
│  • Verificar y canjear cupones de su empresa            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ CLIENT                                                  │
│  • Ver ofertas públicas                                 │
│  • Comprar cupones                                      │
│  • Ver y usar sus cupones                               │
│  • Carrito de compras                                   │
└─────────────────────────────────────────────────────────┘
```

### Cómo se implementa el control de roles

**Backend** — Middleware `CheckRole`:
```php
// El alias 'role' está registrado en bootstrap/app.php
// Se usa en las rutas así: middleware('role:admin')
// O con múltiples roles: middleware('role:employee,company_admin')

public function handle(Request $request, Closure $next, string ...$roles)
{
    if (!in_array($user->role, $roles)) {
        return response()->json(['message' => 'No autorizado'], 403);
    }
    return $next($request);
}
```

**Frontend** — Componente `RoleGuard` en `App.jsx`:
```jsx
// Envuelve las rutas protegidas. Si el usuario no tiene el rol esperado,
// redirige a /offers.
<RoleGuard user={user} roles={["admin"]}>
  <AdminDashboard />
</RoleGuard>
```

---

## 6. Autenticación

Se usa **Laravel Sanctum** con tokens de API (no cookies). El flujo es:

```
1. Usuario hace POST /api/login con email + password
2. Backend valida credenciales y devuelve { user, token }
3. Frontend guarda el token en localStorage
4. Axios interceptor adjunta el token en cada request:
   Authorization: Bearer <token>
5. Al cerrar sesión: DELETE del token en backend + limpieza de localStorage
```

El estado de autenticación se maneja con **Zustand** (`useAuthStore`). Al iniciar la app, `checkAuth()` llama a `GET /api/user` para verificar si el token guardado sigue siendo válido.

---

## 7. Flujo de una oferta (ciclo de vida)

```
Empresa crea oferta  →  status: "Pendiente"
         │
         ▼
Admin revisa la oferta
         │
    ┌────┴────┐
    │         │
 Aprueba   Rechaza
    │         │
    ▼         ▼
"Aprobada"  "Rechazada"
    │
    ▼
Aparece en el catálogo público
(solo si start_date ≤ hoy ≤ end_date y hay stock)
    │
    ▼
Cliente compra → se generan cupones con código único
    │
    ▼
Empleado / company_admin escanea el código y lo canjea
→ status del cupón: "redeemed"
```

Si una oferta fue rechazada, la empresa puede editarla y volver a enviarla a revisión (queda en `Pendiente` nuevamente).

---

## 8. Flujo de compra

```
POST /api/purchases
  body: { offer_id, quantity }
```

El `PurchaseController` hace las siguientes validaciones en orden:
1. El usuario es `client` y tiene perfil de cliente
2. La oferta existe y está `Aprobada`
3. La oferta no venció (`limit_date >= now`)
4. Hay stock suficiente (si `coupon_limit` está definido)
5. El cliente no superó su límite personal (si `coupon_per_user_limit` está definido)

Si todo pasa, crea un registro en `purchases` y genera `quantity` cupones en `coupons` con código único: `<company_code><random_7_digits>`.

Todo dentro de una transacción DB para garantizar consistencia.

---

## 9. Estructura del backend (Laravel)

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Api/
│   │   │   ├── AuthController.php          → login, register, logout, cambio de contraseña
│   │   │   ├── OfferController.php         → ofertas públicas (sin auth)
│   │   │   ├── PurchaseController.php      → comprar oferta (genera cupones)
│   │   │   ├── CouponController.php        → cupones del cliente autenticado
│   │   │   ├── Admin/                      → rutas /admin/* (solo rol admin)
│   │   │   │   ├── OfferController.php     → aprobar/rechazar/republicar
│   │   │   │   ├── CompanyController.php   → CRUD empresas
│   │   │   │   ├── CategoryController.php  → CRUD categorías
│   │   │   │   ├── ClientController.php    → listar clientes y sus cupones
│   │   │   │   ├── EmployeeController.php  → CRUD empleados
│   │   │   │   └── CouponController.php    → todos los cupones del sistema
│   │   │   ├── CompanyAdmin/               → rutas /company/* (solo company_admin)
│   │   │   │   └── OfferController.php     → CRUD de sus propias ofertas
│   │   │   └── EmployeeApi/                → rutas /employee/* (employee + company_admin)
│   │   │       └── CouponController.php    → verificar y canjear cupones
│   │   └── Controller.php
│   ├── Middleware/
│   │   ├── CheckRole.php                   → valida el rol del usuario autenticado
│   │   └── HandleCorsCustom.php            → permite requests desde el frontend React
│   └── Requests/                           → Form Requests con validación
│       ├── LoginRequest.php
│       ├── RegisterRequest.php
│       ├── ChangePasswordRequest.php
│       └── PurchaseRequest.php
├── Models/
│   ├── User.php      → relaciones: client, employee, company (via employee)
│   ├── Client.php
│   ├── Employee.php
│   ├── Category.php
│   ├── Company.php
│   ├── Offer.php     → relaciones: company, coupons, purchases
│   ├── Coupon.php    → relaciones: offer, purchase
│   └── Purchase.php
└── Providers/
    └── AppServiceProvider.php

routes/
└── api.php           → todas las rutas de la API, agrupadas por rol
```

---

## 10. Estructura del frontend (React)

```
src/
├── main.jsx                  → punto de entrada, monta <App />
├── App.jsx                   → BrowserRouter + todas las rutas + RoleGuard
├── services/
│   └── api.js                → instancia de Axios con baseURL y interceptors
├── store/
│   ├── useAuthStore.js       → estado de autenticación (Zustand)
│   ├── useCartStore.js       → carrito de compras (Zustand + persist)
│   └── useThemeStore.js      → tema claro/oscuro
├── components/
│   ├── Navbar.jsx            → barra de navegación adaptada por rol
│   └── PaymentModal.jsx      → modal de compra directa (un solo cupón)
└── pages/
    ├── Login.jsx             → formulario de inicio de sesión
    ├── Register.jsx          → registro de cuenta (stepper 3 pasos)
    ├── Offers.jsx            → catálogo público de ofertas
    ├── Coupons.jsx           → mis cupones (cliente)
    ├── Cart.jsx              → carrito + checkout (cliente)
    ├── Profile.jsx           → perfil del cliente
    ├── ChangePassword.jsx    → cambio de contraseña
    ├── admin/
    │   ├── AdminDashboard.jsx    → estadísticas generales
    │   ├── AdminCategories.jsx   → CRUD de rubros
    │   ├── AdminCompanies.jsx    → CRUD empresas + panel de ofertas por empresa
    │   ├── AdminClients.jsx      → listado de clientes
    │   ├── AdminOffers.jsx       → moderación de ofertas (aprobar/rechazar)
    │   ├── AdminEmployees.jsx    → gestión de empleados
    │   └── AdminCoupons.jsx      → vista global de cupones
    ├── company/
    │   └── CompanyOffers.jsx     → CRUD de ofertas de la empresa
    └── employee/
        └── RedeemCoupon.jsx      → verificar y canjear cupones
```

---

## 11. Gestión del estado (Zustand)

Se eligió **Zustand** por ser liviano y no requerir Provider wrapper. Hay tres stores:

### `useAuthStore`
Centraliza todo lo relacionado con la sesión del usuario. Al abrir la app, `checkAuth()` valida si el token en localStorage sigue activo haciendo `GET /api/user`. Si no responde, limpia el estado.

### `useCartStore`
Persiste el carrito en `localStorage` usando el middleware `persist` de Zustand (clave: `cuponera-cart`). Almacena un array de `{ offer, quantity }`.

### `useThemeStore`
Controla el tema claro/oscuro.

---

## 12. Rutas de la API (resumen)

### Públicas (sin token)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/register` | Crear cuenta de cliente |
| POST | `/api/login` | Iniciar sesión |
| GET | `/api/offers` | Listar ofertas vigentes y aprobadas |
| GET | `/api/categories` | Listar rubros |

### Autenticadas (cualquier rol)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/user` | Perfil del usuario |
| PUT | `/api/user/profile` | Actualizar perfil |
| POST | `/api/logout` | Cerrar sesión |
| POST | `/api/change-password` | Cambiar contraseña |
| POST | `/api/purchases` | Comprar oferta (genera cupones) |
| GET | `/api/my-coupons` | Mis cupones (cliente) |

### Admin (`role:admin`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/stats` | Estadísticas del dashboard |
| GET/POST/PUT/DELETE | `/api/admin/categories` | CRUD rubros |
| GET/POST/PUT/DELETE | `/api/admin/companies` | CRUD empresas |
| GET | `/api/admin/companies/{id}/offers` | Ofertas de una empresa |
| GET/PUT/DELETE | `/api/admin/offers` | Gestión de ofertas |
| PUT | `/api/admin/offers/{id}/approve` | Aprobar oferta |
| PUT | `/api/admin/offers/{id}/reject` | Rechazar oferta |
| PUT | `/api/admin/offers/{id}/republish` | Volver a Pendiente |
| GET | `/api/admin/clients` | Listar clientes |
| GET | `/api/admin/coupons` | Todos los cupones |
| GET/POST/DELETE | `/api/admin/employees` | Gestión de empleados |

### Admin de empresa (`role:company_admin`)
| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/api/company/offers` | Listar y crear ofertas |
| PUT/PATCH/DELETE | `/api/company/offers/{id}` | Editar o eliminar oferta propia |

> Se usa PATCH (en lugar de PUT) cuando se sube una imagen como archivo, porque los formularios multipart no admiten PUT en algunos servidores.

### Empleado (`role:employee` o `role:company_admin`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/employee/coupons/verify/{code}` | Verificar cupón sin canjearlo |
| POST | `/api/employee/coupons/redeem` | Canjear cupón definitivamente |

---

## 13. Comunicación frontend ↔ backend (Axios)

El archivo `src/services/api.js` configura una instancia de Axios con:

- **baseURL**: tomada de la variable de entorno `VITE_API_URL` (definida en `.env`)
- **Interceptor de request**: adjunta el token Bearer de `localStorage` en cada petición
- **Interceptor de response**: si el servidor responde 401, limpia el token del storage

Esto evita tener que adjuntar el token manualmente en cada llamada.

---

## 14. Variables de entorno

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:8000
```

### Backend (`.env`)
```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=la_cuponera
DB_USERNAME=...
DB_PASSWORD=...
```

---

## 15. Usuarios de prueba (seeder)

| Email | Contraseña | Rol |
|---|---|---|
| admin@cuponera.com | password | Administrador |
| empresa@cuponera.com | password | Admin de empresa |
| empleado@cuponera.com | password | Empleado |
| cliente@cuponera.com | password | Cliente |

Para regenerar los datos de prueba:
```bash
php artisan migrate:fresh --seed
```

---

## 16. Decisiones de diseño relevantes

### ¿Por qué Sanctum con tokens y no cookies?
El frontend y el backend corren en orígenes distintos (puertos diferentes en dev, dominios distintos en producción). Los tokens de API son más simples de configurar en ese escenario que las cookies de sesión.

### ¿Por qué PATCH para subir imágenes?
Los formularios `multipart/form-data` necesarios para subir archivos no son compatibles con `PUT` en muchos servidores y en PHP (`$_FILES` no se llena con PUT). Se registran dos rutas para la misma acción (`PUT` y `PATCH`) y el frontend usa PATCH cuando hay imagen.

### ¿Por qué el empleado también se registra como `employee` en la BD aunque sea `company_admin`?
El `CouponController` del área de empleados necesita saber a qué empresa pertenece el usuario para restringir el canje a sus propios cupones. En lugar de hacer una lógica distinta por rol, se unificó: todo usuario que puede canjear cupones tiene un registro en la tabla `employees` que lo vincula a su empresa.

### ¿Por qué Zustand en lugar de Redux o Context?
Menos boilerplate, no necesita Provider, y el middleware `persist` integra el localStorage con una sola línea.
