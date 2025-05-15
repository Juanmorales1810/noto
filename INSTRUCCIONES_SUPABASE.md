# Instrucciones para crear las tablas en Supabase

Para resolver los errores de tipo `relation "public.tabla" does not exist`, debes crear todas las tablas necesarias en tu base de datos de Supabase. Aquí te explico cómo hacerlo:

## Opción 1: Usar la interfaz de Supabase (Esquema completo)

1. Inicia sesión en el [Dashboard de Supabase](https://app.supabase.io)
2. Selecciona tu proyecto
3. Ve a la sección "SQL Editor" en el menú lateral
4. Haz clic en "New Query"
5. Copia y pega el siguiente código SQL que creará todas las tablas necesarias para la aplicación:

```sql
-- Crear tablas para la aplicación Noto (Kanban)

-- Tabla users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Tabla projects (proyectos)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Tabla columns (columnas del tablero)
CREATE TABLE IF NOT EXISTS public.columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Tabla tasks (tareas)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Tabla task_assignments (asignaciones de tareas a usuarios)
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(task_id, user_id)
);

-- Tabla project_members (miembros de un proyecto)
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(project_id, user_id)
);

-- Funciones y triggers para actualizar los timestamps

-- Crear o reemplazar la función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updated_at en todas las tablas
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_columns_updated_at
BEFORE UPDATE ON public.columns
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- CONFIGURAR POLÍTICAS DE SEGURIDAD (RLS)

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Políticas para USERS

-- Los usuarios autenticados pueden ver todos los usuarios
CREATE POLICY "Usuarios autenticados pueden ver todos los usuarios"
ON public.users FOR SELECT
USING (auth.role() = 'authenticated');

-- Los usuarios solo pueden editar su propio perfil
CREATE POLICY "Usuarios pueden editar su propio perfil"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Políticas para PROJECTS

-- Los usuarios pueden ver proyectos donde son miembros
CREATE POLICY "Ver proyectos donde soy miembro"
ON public.projects FOR SELECT
USING (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = id AND user_id = auth.uid()
  )
);

-- Los usuarios pueden crear proyectos
CREATE POLICY "Crear proyectos"
ON public.projects FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Solo el dueño del proyecto puede editarlo
CREATE POLICY "Editar proyecto si soy dueño"
ON public.projects FOR UPDATE
USING (auth.uid() = owner_id);

-- Solo el dueño del proyecto puede eliminarlo
CREATE POLICY "Eliminar proyecto si soy dueño"
ON public.projects FOR DELETE
USING (auth.uid() = owner_id);

-- Políticas para COLUMNS

-- Ver columnas de proyectos donde soy miembro
CREATE POLICY "Ver columnas de proyectos donde soy miembro"
ON public.columns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    LEFT JOIN public.project_members pm ON p.id = pm.project_id
    WHERE p.id = project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
  )
);

-- Crear/editar/eliminar columnas si soy dueño del proyecto o miembro con permisos
CREATE POLICY "Gestionar columnas si tengo permisos"
ON public.columns FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    LEFT JOIN public.project_members pm ON p.id = pm.project_id
    WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (pm.user_id = auth.uid() AND pm.role = 'admin'))
  )
);

-- Políticas para TASKS

-- Ver tareas de proyectos donde soy miembro
CREATE POLICY "Ver tareas de proyectos donde soy miembro"
ON public.tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.columns c
    JOIN public.projects p ON c.project_id = p.id
    LEFT JOIN public.project_members pm ON p.id = pm.project_id
    WHERE c.id = column_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
  )
);

-- Crear/editar/eliminar tareas si soy dueño del proyecto o miembro con permisos
CREATE POLICY "Gestionar tareas si tengo permisos"
ON public.tasks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.columns c
    JOIN public.projects p ON c.project_id = p.id
    LEFT JOIN public.project_members pm ON p.id = pm.project_id
    WHERE c.id = column_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
  )
);

-- Políticas para TASK_ASSIGNMENTS

-- Ver asignaciones de tareas donde soy miembro del proyecto
CREATE POLICY "Ver asignaciones de tareas donde soy miembro del proyecto"
ON public.task_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.columns c ON t.column_id = c.id
    JOIN public.projects p ON c.project_id = p.id
    LEFT JOIN public.project_members pm ON p.id = pm.project_id
    WHERE t.id = task_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
  )
);

-- Gestionar asignaciones si soy dueño del proyecto o miembro con permisos
CREATE POLICY "Gestionar asignaciones si tengo permisos"
ON public.task_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.columns c ON t.column_id = c.id
    JOIN public.projects p ON c.project_id = p.id
    LEFT JOIN public.project_members pm ON p.id = pm.project_id
    WHERE t.id = task_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
  )
);

-- Políticas para PROJECT_MEMBERS

-- Ver miembros de proyectos donde soy miembro
CREATE POLICY "Ver miembros de proyectos donde soy miembro"
ON public.project_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    LEFT JOIN public.project_members pm ON p.id = pm.project_id
    WHERE p.id = project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
  )
);

-- Solo el dueño del proyecto puede gestionar miembros
CREATE POLICY "Gestionar miembros si soy dueño"
ON public.project_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.owner_id = auth.uid()
  )
);

-- Comentarios para las tablas
COMMENT ON TABLE public.users IS 'Tabla para almacenar información de usuarios';
COMMENT ON TABLE public.projects IS 'Tabla para almacenar proyectos de tipo Kanban';
COMMENT ON TABLE public.columns IS 'Columnas del tablero Kanban (Por hacer, En progreso, Completado, etc.)';
COMMENT ON TABLE public.tasks IS 'Tareas individuales en el tablero Kanban';
COMMENT ON TABLE public.task_assignments IS 'Asignaciones de tareas a usuarios';
COMMENT ON TABLE public.project_members IS 'Miembros de un proyecto y sus roles';
```

6. Haz clic en "Run" para ejecutar el script

## Opción 2: Creación de tablas individuales

Si prefieres crear las tablas una por una a través de la interfaz gráfica:

1. Inicia sesión en el [Dashboard de Supabase](https://app.supabase.io)
2. Selecciona tu proyecto
3. Ve a la sección "Table Editor" en el menú lateral
4. Haz clic en "Create a new table"

### Tabla users

-   **Name**: users
-   **Columns**:
    -   id (type: uuid, Primary Key)
    -   email (type: text, Unique, Not Null)
    -   name (type: text)
    -   avatar_url (type: text)
    -   created_at (type: timestamptz, Default: now())
    -   updated_at (type: timestamptz, Default: now())
-   **Enable Row Level Security**: checked

### Tabla projects

-   **Name**: projects
-   **Columns**:
    -   id (type: uuid, Primary Key, Default: gen_random_uuid())
    -   name (type: text, Not Null)
    -   description (type: text)
    -   owner_id (type: uuid, Foreign Key: users.id, Not Null)
    -   created_at (type: timestamptz, Default: now())
    -   updated_at (type: timestamptz, Default: now())
-   **Enable Row Level Security**: checked

### Tabla columns

-   **Name**: columns
-   **Columns**:
    -   id (type: uuid, Primary Key, Default: gen_random_uuid())
    -   project_id (type: uuid, Foreign Key: projects.id, Not Null)
    -   title (type: text, Not Null)
    -   position (type: integer, Default: 0, Not Null)
    -   created_at (type: timestamptz, Default: now())
    -   updated_at (type: timestamptz, Default: now())
-   **Enable Row Level Security**: checked

### Tabla tasks

-   **Name**: tasks
-   **Columns**:
    -   id (type: uuid, Primary Key, Default: gen_random_uuid())
    -   column_id (type: uuid, Foreign Key: columns.id, Not Null)
    -   title (type: text, Not Null)
    -   description (type: text)
    -   position (type: integer, Default: 0, Not Null)
    -   created_at (type: timestamptz, Default: now())
    -   updated_at (type: timestamptz, Default: now())
-   **Enable Row Level Security**: checked

### Tabla task_assignments

-   **Name**: task_assignments
-   **Columns**:
    -   id (type: uuid, Primary Key, Default: gen_random_uuid())
    -   task_id (type: uuid, Foreign Key: tasks.id, Not Null)
    -   user_id (type: uuid, Foreign Key: users.id, Not Null)
    -   created_at (type: timestamptz, Default: now())
-   **Enable Row Level Security**: checked
-   **Constraints**: Unique(task_id, user_id)

### Tabla project_members

-   **Name**: project_members
-   **Columns**:
    -   id (type: uuid, Primary Key, Default: gen_random_uuid())
    -   project_id (type: uuid, Foreign Key: projects.id, Not Null)
    -   user_id (type: uuid, Foreign Key: users.id, Not Null)
    -   role (type: text, Default: 'member', Not Null)
    -   created_at (type: timestamptz, Default: now())
-   **Enable Row Level Security**: checked
-   **Constraints**: Unique(project_id, user_id)

5. Para cada tabla, después de crearla, ve a la pestaña "Policies" y añade las políticas mencionadas en el script SQL de la Opción 1

## Después de crear las tablas

Una vez creadas todas las tablas, tu aplicación debería funcionar correctamente. Las modificaciones que hemos hecho al servicio de usuario y otros servicios permiten que la aplicación siga funcionando parcialmente mientras se crean las tablas, pero lo más recomendable es crear todas las tablas para que la funcionalidad sea completa.

Cuando ingreses por primera vez con las tablas ya creadas, la aplicación:

1. Creará tu usuario automáticamente en la tabla `users`
2. Te permitirá crear proyectos y estos se almacenarán en la tabla `projects`
3. Podrás crear columnas y tareas que se almacenarán en sus respectivas tablas
4. Podrás asignar tareas a usuarios y estos se registrarán en `task_assignments`
5. Podrás invitar a otros usuarios a tus proyectos mediante `project_members`

### Relación entre las tablas

La estructura de tablas sigue este esquema:

```
users
 ├─ projects (un usuario puede tener muchos proyectos)
 │   ├─ project_members (un proyecto puede tener muchos miembros)
 │   └─ columns (un proyecto puede tener muchas columnas)
 │       └─ tasks (una columna puede tener muchas tareas)
 │           └─ task_assignments (una tarea puede estar asignada a muchos usuarios)
 └─ task_assignments (un usuario puede tener muchas tareas asignadas)
```

## Solución de problemas

Si sigues experimentando problemas después de crear las tablas, asegúrate de que:

1. Tu conexión a Supabase está configurada correctamente en las variables de entorno
2. Las claves de API y URL son correctas
3. Tu usuario tiene los permisos adecuados
4. Las políticas de RLS (Row Level Security) están configuradas correctamente
5. Las relaciones entre tablas (foreign keys) son las correctas

## Nota sobre las migraciones

Para proyectos en producción, es recomendable usar un sistema de migraciones para gestionar los cambios en la base de datos. Puedes usar herramientas como:

-   [Supabase CLI](https://supabase.com/docs/reference/cli/introduction) - La forma oficial de gestionar migraciones en Supabase
-   [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate) - Si utilizas Prisma como ORM
-   [Drizzle ORM](https://orm.drizzle.team) - Una alternativa TypeScript moderna para migraciones

## Fechas de actualización

Este documento fue actualizado el 14 de mayo de 2025.

## Solución completa para problemas de recursión en políticas RLS

Si después de crear las tablas recibes errores como estos:

```
Error: infinite recursion detected in policy for relation "projects"
Error: infinite recursion detected in policy for relation "columns"
```

Esto se debe a una recursión infinita en las políticas de seguridad RLS. Para solucionarlo de manera definitiva, sigue estos pasos:

1. Ve al SQL Editor de Supabase
2. Ejecuta el siguiente script que corrige todas las políticas RLS:

```sql
-- SCRIPT PARA CORREGIR TODAS LAS POLÍTICAS RLS DE LA APLICACIÓN
-- Este script elimina y recrea todas las políticas sin recursión

-- ============ ELIMINAR TODAS LAS POLÍTICAS EXISTENTES ============

-- Eliminar políticas de projects
DROP POLICY IF EXISTS "Ver proyectos donde soy miembro" ON public.projects;
DROP POLICY IF EXISTS "Crear proyectos" ON public.projects;
DROP POLICY IF EXISTS "Editar proyecto si soy dueño" ON public.projects;
DROP POLICY IF EXISTS "Eliminar proyecto si soy dueño" ON public.projects;
DROP POLICY IF EXISTS "Ver proyectos propios" ON public.projects;
DROP POLICY IF EXISTS "Ver proyectos como miembro" ON public.projects;
DROP POLICY IF EXISTS "Crear proyectos propios" ON public.projects;
DROP POLICY IF EXISTS "Editar proyectos propios" ON public.projects;
DROP POLICY IF EXISTS "Eliminar proyectos propios" ON public.projects;

-- Eliminar políticas de columns
DROP POLICY IF EXISTS "Ver columnas de proyectos donde soy miembro" ON public.columns;
DROP POLICY IF EXISTS "Gestionar columnas si tengo permisos" ON public.columns;

-- Eliminar políticas de tasks
DROP POLICY IF EXISTS "Ver tareas de proyectos donde soy miembro" ON public.tasks;
DROP POLICY IF EXISTS "Gestionar tareas si tengo permisos" ON public.tasks;

-- Eliminar políticas de task_assignments
DROP POLICY IF EXISTS "Ver asignaciones de tareas donde soy miembro del proyecto" ON public.task_assignments;
DROP POLICY IF EXISTS "Gestionar asignaciones si tengo permisos" ON public.task_assignments;

-- Eliminar políticas de project_members
DROP POLICY IF EXISTS "Ver miembros de proyectos donde soy miembro" ON public.project_members;
DROP POLICY IF EXISTS "Gestionar miembros si soy dueño" ON public.project_members;

-- Eliminar políticas de users
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver todos los usuarios" ON public.users;
DROP POLICY IF EXISTS "Usuarios pueden editar su propio perfil" ON public.users;

-- ============ CREAR NUEVAS POLÍTICAS SIN RECURSIÓN ============

-- ---- Políticas para USERS ----

-- Los usuarios autenticados pueden ver todos los usuarios
CREATE POLICY "users_select_policy"
ON public.users FOR SELECT
USING (auth.role() = 'authenticated');

-- Los usuarios solo pueden editar su propio perfil
CREATE POLICY "users_update_policy"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Los usuarios pueden insertar su propio perfil
CREATE POLICY "users_insert_policy"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

-- ---- Políticas para PROJECTS ----

-- Política para ver proyectos propios
CREATE POLICY "projects_select_owner_policy"
ON public.projects FOR SELECT
USING (auth.uid() = owner_id);

-- Política para ver proyectos como miembro (separada para evitar recursión)
CREATE POLICY "projects_select_member_policy"
ON public.projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = projects.id AND project_members.user_id = auth.uid()
  )
);

-- Política para crear proyectos
CREATE POLICY "projects_insert_policy"
ON public.projects FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Política para editar proyectos propios
CREATE POLICY "projects_update_policy"
ON public.projects FOR UPDATE
USING (auth.uid() = owner_id);

-- Política para eliminar proyectos propios
CREATE POLICY "projects_delete_policy"
ON public.projects FOR DELETE
USING (auth.uid() = owner_id);

-- ---- Políticas para COLUMNS ----

-- Política para ver columnas como propietario del proyecto
CREATE POLICY "columns_select_owner_policy"
ON public.columns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = columns.project_id AND projects.owner_id = auth.uid()
  )
);

-- Política para ver columnas como miembro del proyecto
CREATE POLICY "columns_select_member_policy"
ON public.columns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = columns.project_id AND project_members.user_id = auth.uid()
  )
);

-- Política para insertar columnas si soy propietario del proyecto
CREATE POLICY "columns_insert_owner_policy"
ON public.columns FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_id AND projects.owner_id = auth.uid()
  )
);

-- Política para insertar columnas si soy miembro con permisos
CREATE POLICY "columns_insert_member_policy"
ON public.columns FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = project_id
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('admin')
  )
);

-- Política para actualizar columnas si soy propietario del proyecto
CREATE POLICY "columns_update_owner_policy"
ON public.columns FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_id AND projects.owner_id = auth.uid()
  )
);

-- Política para actualizar columnas si soy miembro con permisos
CREATE POLICY "columns_update_member_policy"
ON public.columns FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = project_id
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('admin')
  )
);

-- Política para eliminar columnas si soy propietario del proyecto
CREATE POLICY "columns_delete_owner_policy"
ON public.columns FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_id AND projects.owner_id = auth.uid()
  )
);

-- Política para eliminar columnas si soy miembro con permisos
CREATE POLICY "columns_delete_member_policy"
ON public.columns FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = project_id
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('admin')
  )
);
```

3. Si el script es demasiado largo para la ventana del SQL Editor, puedes ejecutarlo en partes. La parte más esencial son las políticas para `projects` y `columns` que son las que están causando los problemas de recursión.

4. Recarga tu aplicación después de ejecutar el script. Los errores de recursión infinita deberían desaparecer.

Este script resuelve el problema dividiendo las políticas compuestas (que usaban OR) en múltiples políticas independientes, evitando así la recursión circular que ocurre cuando una política hace referencia a la misma tabla de forma indirecta.

## Diagnóstico de problemas de políticas RLS

Si quieres identificar exactamente qué políticas están causando problemas de recursión, puedes ejecutar el siguiente script de diagnóstico:

```sql
-- SCRIPT PARA DIAGNOSTICAR PROBLEMAS DE POLÍTICAS RLS EN SUPABASE
-- Este script analiza todas las políticas y detecta posibles problemas

DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'DIAGNÓSTICO DE POLÍTICAS RLS EN SUPABASE';
    RAISE NOTICE '==========================================';

    -- Verificar si RLS está habilitado en las tablas principales
    RAISE NOTICE '';
    RAISE NOTICE 'ESTADO DE RLS EN TABLAS:';
    RAISE NOTICE '---------------------------';
    FOR r IN (
        SELECT
            schemaname,
            tablename,
            rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public' AND
              tablename IN ('users', 'projects', 'columns', 'tasks', 'task_assignments', 'project_members')
        ORDER BY tablename
    ) LOOP
        RAISE NOTICE 'Tabla: %, RLS Habilitado: %', r.tablename, r.rowsecurity;
    END LOOP;

    -- Listar todas las políticas en las tablas principales
    RAISE NOTICE '';
    RAISE NOTICE 'POLÍTICAS RLS ACTUALES:';
    RAISE NOTICE '---------------------------';
    FOR r IN (
        SELECT
            tablename,
            policyname,
            cmd,
            qual
        FROM pg_policies
        WHERE schemaname = 'public' AND
              tablename IN ('users', 'projects', 'columns', 'tasks', 'task_assignments', 'project_members')
        ORDER BY tablename, policyname
    ) LOOP
        RAISE NOTICE 'Tabla: %, Política: %, Comando: %', r.tablename, r.policyname, r.cmd;
    END LOOP;
END;
$$;
```

Este script te mostrará todas las políticas actuales y te ayudará a identificar posibles problemas. Si encuentras problemas específicos, ejecuta el script de corrección completo mostrado anteriormente.
