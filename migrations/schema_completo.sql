-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear políticas de seguridad para RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

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

-- Crear tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Asegurarse de que RLS está habilitado en todas las tablas
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas para proyectos
CREATE POLICY "Usuarios pueden ver sus propios proyectos"
ON projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propios proyectos"
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios proyectos"
ON projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios proyectos"
ON projects FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para columnas
CREATE POLICY "Usuarios pueden ver columnas de sus proyectos"
ON columns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = columns.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden insertar columnas en sus proyectos"
ON columns FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = columns.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden actualizar columnas de sus proyectos"
ON columns FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = columns.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden eliminar columnas de sus proyectos"
ON columns FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = columns.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Políticas para tareas
CREATE POLICY "Usuarios pueden ver tareas de sus proyectos"
ON tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM columns
    JOIN projects ON projects.id = columns.project_id
    WHERE columns.id = tasks.column_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden insertar tareas en sus proyectos"
ON tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM columns
    JOIN projects ON projects.id = columns.project_id
    WHERE columns.id = tasks.column_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden actualizar tareas de sus proyectos"
ON tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM columns
    JOIN projects ON projects.id = columns.project_id
    WHERE columns.id = tasks.column_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden eliminar tareas de sus proyectos"
ON tasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM columns
    JOIN projects ON projects.id = columns.project_id
    WHERE columns.id = tasks.column_id
    AND projects.user_id = auth.uid()
  )
);

-- Políticas para asignaciones de tareas
CREATE POLICY "Usuarios pueden ver asignaciones de tareas de sus proyectos"
ON task_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks
    JOIN columns ON columns.id = tasks.column_id
    JOIN projects ON projects.id = columns.project_id
    WHERE tasks.id = task_assignments.task_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden insertar asignaciones de tareas en sus proyectos"
ON task_assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks
    JOIN columns ON columns.id = tasks.column_id
    JOIN projects ON projects.id = columns.project_id
    WHERE tasks.id = task_assignments.task_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden eliminar asignaciones de tareas de sus proyectos"
ON task_assignments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM tasks
    JOIN columns ON columns.id = tasks.column_id
    JOIN projects ON projects.id = columns.project_id
    WHERE tasks.id = task_assignments.task_id
    AND projects.user_id = auth.uid()
  )
);

-- Crear tabla project_members si no existe
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Habilitar RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Políticas para project_members
-- Política de lectura: puede ver membresías de proyectos donde es owner o miembro
CREATE POLICY "Propietarios pueden ver miembros de sus proyectos" 
ON project_members FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM projects p 
        WHERE p.id = project_id AND p.user_id = auth.uid()
    )
);

CREATE POLICY "Miembros pueden ver otros miembros del proyecto" 
ON project_members FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid()
    )
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
