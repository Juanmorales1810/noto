# Noto - Aplicación Kanban con Next.js y Supabase

Noto es una aplicación de gestión de proyectos estilo Kanban construida con Next.js y Supabase. Permite gestionar proyectos, crear tableros con columnas, añadir tareas y asignarlas a usuarios.

## Requisitos previos

-   Node.js v18 o superior
-   Una cuenta en [Supabase](https://supabase.com)

## Configuración de la base de datos

Para el correcto funcionamiento de la aplicación, debes configurar las tablas en Supabase:

1. Crea un nuevo proyecto en Supabase
2. Configura la autenticación (email, Google, GitHub, etc.)
3. Crea las tablas necesarias ejecutando el script SQL que se encuentra en `migrations/schema_completo.sql`
4. Consulta las instrucciones detalladas en el archivo [INSTRUCCIONES_SUPABASE.md](./INSTRUCCIONES_SUPABASE.md)

## Configuración del entorno

1. Clona este repositorio
2. Instala las dependencias:

```bash
npm install
# o
pnpm install
# o
yarn install
```

3. Crea un archivo `.env.local` con las siguientes variables:

```env
# URL de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
# Clave anónima de Supabase (Public Key)
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica
# Clave secreta de Supabase (solo para uso en servidor)
SUPABASE_SERVICE_ROLE_KEY=tu-clave-secreta
```

## Inicio del servidor de desarrollo

```bash
npm run dev
# o
pnpm dev
# o
yarn dev
```

Abre [http://localhost:3000](http://localhost:3000) con tu navegador para ver la aplicación.

## Características principales

-   Autenticación de usuarios con Supabase
-   Creación y gestión de proyectos Kanban
-   Tableros con columnas personalizables
-   Tareas con descripción y asignación a usuarios
-   Interfaz de arrastrar y soltar para mover tareas
-   Diseño responsivo para dispositivos móviles y escritorio

## Estructura de la base de datos

La aplicación utiliza las siguientes tablas:

-   `users`: Almacena información de los usuarios
-   `projects`: Proyectos Kanban
-   `columns`: Columnas dentro de cada proyecto (Por hacer, En progreso, etc.)
-   `tasks`: Tareas individuales
-   `task_assignments`: Asignaciones de tareas a usuarios
-   `project_members`: Miembros de cada proyecto y sus roles

## Tecnologías utilizadas

-   [Next.js](https://nextjs.org) - Framework de React
-   [TypeScript](https://www.typescriptlang.org) - Tipado estático
-   [Supabase](https://supabase.com) - Gestión de base de datos y autenticación
-   [Tailwind CSS](https://tailwindcss.com) - Estilos
-   [Shadcn UI](https://ui.shadcn.com) - Componentes UI
-   [Lucide React](https://lucide.dev) - Iconos
-   [Auto Animate](https://auto-animate.formkit.com) - Animaciones

## Contribución

Las contribuciones son bienvenidas. Por favor, asegúrate de seguir estas pautas:

1. Haz fork del repositorio
2. Crea una nueva rama para tu funcionalidad (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Envía tu rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request
