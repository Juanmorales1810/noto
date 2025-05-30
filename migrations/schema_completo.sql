-- Limpiar políticas existentes para evitar conflictos de recursión
DO $$ 
BEGIN
    -- Eliminar políticas de users
    DROP POLICY IF EXISTS "Los usuarios pueden ver todos los perfiles" ON users;
    DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON users;
    DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio perfil" ON users;
    
    -- Eliminar políticas de projects
    DROP POLICY IF EXISTS "Usuarios pueden ver proyectos donde participan" ON projects;
    DROP POLICY IF EXISTS "Propietarios pueden ver sus proyectos" ON projects;
    DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios proyectos" ON projects;
    DROP POLICY IF EXISTS "Propietarios pueden actualizar sus proyectos" ON projects;
    DROP POLICY IF EXISTS "Propietarios pueden eliminar sus proyectos" ON projects;
    
    -- Eliminar políticas de project_members
    DROP POLICY IF EXISTS "Usuarios pueden ver miembros de proyectos donde participan" ON project_members;
    DROP POLICY IF EXISTS "Propietarios pueden agregar miembros a sus proyectos" ON project_members;
    DROP POLICY IF EXISTS "Propietarios pueden actualizar miembros de sus proyectos" ON project_members;
    DROP POLICY IF EXISTS "Propietarios pueden eliminar miembros de sus proyectos" ON project_members;
    DROP POLICY IF EXISTS "Miembros pueden abandonar proyectos" ON project_members;
    
    -- Eliminar políticas de columns
    DROP POLICY IF EXISTS "Usuarios pueden ver columnas de sus proyectos" ON columns;
    DROP POLICY IF EXISTS "Usuarios pueden insertar columnas en sus proyectos" ON columns;
    DROP POLICY IF EXISTS "Usuarios pueden actualizar columnas de sus proyectos" ON columns;
    DROP POLICY IF EXISTS "Usuarios pueden eliminar columnas de sus proyectos" ON columns;
    
    -- Eliminar políticas de tasks
    DROP POLICY IF EXISTS "Usuarios pueden ver tareas de sus proyectos" ON tasks;
    DROP POLICY IF EXISTS "Usuarios pueden insertar tareas en sus proyectos" ON tasks;
    DROP POLICY IF EXISTS "Usuarios pueden actualizar tareas de sus proyectos" ON tasks;
    DROP POLICY IF EXISTS "Usuarios pueden eliminar tareas de sus proyectos" ON tasks;
    
    -- Eliminar políticas de task_assignments
    DROP POLICY IF EXISTS "Usuarios pueden ver asignaciones de tareas de sus proyectos" ON task_assignments;
    DROP POLICY IF EXISTS "Usuarios pueden insertar asignaciones de tareas en sus proyectos" ON task_assignments;
    DROP POLICY IF EXISTS "Usuarios pueden eliminar asignaciones de tareas de sus proyectos" ON task_assignments;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignorar errores si las políticas no existen
END $$;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla project_members
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Crear tabla de columnas
CREATE TABLE IF NOT EXISTS columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de tareas
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de asignaciones de usuarios a tareas
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Los usuarios pueden ver todos los perfiles"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden insertar su propio perfil"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas para proyectos (simples para evitar recursión)
CREATE POLICY "Propietarios pueden ver sus proyectos"
ON projects FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Usuarios pueden insertar sus propios proyectos"
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Propietarios pueden actualizar sus proyectos"
ON projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Propietarios pueden eliminar sus proyectos"
ON projects FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para columnas (simples para evitar recursión)
CREATE POLICY "Usuarios pueden ver columnas de sus proyectos"
ON columns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = columns.project_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden insertar columnas en sus proyectos"
ON columns FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = columns.project_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden actualizar columnas de sus proyectos"
ON columns FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = columns.project_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden eliminar columnas de sus proyectos"
ON columns FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = columns.project_id AND p.user_id = auth.uid()
  )
);

-- Políticas para tareas (simples para evitar recursión)
CREATE POLICY "Usuarios pueden ver tareas de sus proyectos"
ON tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM columns c
    JOIN projects p ON p.id = c.project_id
    WHERE c.id = tasks.column_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden insertar tareas en sus proyectos"
ON tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM columns c
    JOIN projects p ON p.id = c.project_id
    WHERE c.id = tasks.column_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden actualizar tareas de sus proyectos"
ON tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM columns c
    JOIN projects p ON p.id = c.project_id
    WHERE c.id = tasks.column_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden eliminar tareas de sus proyectos"
ON tasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM columns c
    JOIN projects p ON p.id = c.project_id
    WHERE c.id = tasks.column_id AND p.user_id = auth.uid()
  )
);

-- Políticas para asignaciones de tareas (simples para evitar recursión)
CREATE POLICY "Usuarios pueden ver asignaciones de tareas de sus proyectos"
ON task_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON c.id = t.column_id
    JOIN projects p ON p.id = c.project_id
    WHERE t.id = task_assignments.task_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden insertar asignaciones de tareas en sus proyectos"
ON task_assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON c.id = t.column_id
    JOIN projects p ON p.id = c.project_id
    WHERE t.id = task_assignments.task_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden eliminar asignaciones de tareas de sus proyectos"
ON task_assignments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON c.id = t.column_id
    JOIN projects p ON p.id = c.project_id
    WHERE t.id = task_assignments.task_id AND p.user_id = auth.uid()
  )
);

-- Políticas para project_members
-- Política de lectura: propietarios y miembros pueden ver membresías
CREATE POLICY "Usuarios pueden ver miembros de proyectos donde participan" 
ON project_members FOR SELECT 
USING (
    -- Es el propietario del proyecto
    EXISTS (
        SELECT 1 FROM projects p 
        WHERE p.id = project_id AND p.user_id = auth.uid()
    )
    OR
    -- Es miembro del proyecto (usando user_id directamente para evitar recursión)
    user_id = auth.uid()
);

-- Política de inserción: solo owners pueden agregar miembros
CREATE POLICY "Propietarios pueden agregar miembros a sus proyectos" 
ON project_members FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects 
        WHERE id = project_id AND user_id = auth.uid()
    )
);

-- Política de actualización: solo owners pueden modificar roles
CREATE POLICY "Propietarios pueden actualizar miembros de sus proyectos" 
ON project_members FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM projects 
        WHERE id = project_id AND user_id = auth.uid()
    )
);

-- Política de eliminación: owners pueden eliminar miembros, miembros pueden abandonar
CREATE POLICY "Propietarios pueden eliminar miembros de sus proyectos" 
ON project_members FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM projects 
        WHERE id = project_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Miembros pueden abandonar proyectos" 
ON project_members FOR DELETE 
USING (user_id = auth.uid());

-- Comentario
COMMENT ON TABLE project_members IS 'Miembros de un proyecto y sus roles';
