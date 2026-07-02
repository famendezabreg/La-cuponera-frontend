# La Cuponera — Frontend

SPA en React para **La Cuponera**, una plataforma de cupones y descuentos que conecta comercios con clientes finales. Consume la API REST del backend en Laravel ([La-cuponera-backend](https://github.com/famendezabreg/La-cuponera-backend)).

Documentación completa de arquitectura, diagrama de base de datos y stack: ver [`ARQUITECTURA.md`](./ARQUITECTURA.md).

## Stack

- **React 19** + **Vite**
- **Tailwind CSS v4** — estilos
- **Zustand** — estado global (auth, carrito, tema)
- **Axios** — cliente HTTP
- **React Router v7** — navegación

## Vistas por rol

El frontend adapta la navegación según el rol del usuario autenticado (dato que viene del backend):

- **Cliente** — catálogo de ofertas, carrito, compra, mis cupones, perfil
- **Admin** — dashboard, gestión de empresas, categorías, empleados, aprobación de ofertas, vista global de cupones
- **Company admin** — gestión de ofertas de su propia empresa
- **Employee** — verificación y canje de cupones en punto de venta

## Instalación local

\`\`\`bash
npm install
npm run dev
\`\`\`

Por defecto corre en `http://localhost:5173` y espera la API en `http://localhost:8000` (configurable en `src/services/api.js`).

## Proyecto relacionado

Backend en Laravel: [La-cuponera-backend](https://github.com/famendezabreg/La-cuponera-backend)