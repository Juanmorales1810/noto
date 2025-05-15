-- Crear tablas para la aplicación Noto (Kanban)

-- Tabla users (ya debe existir según las instrucciones anteriores)
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
