-- SCRIPT PARA CORREGIR TODAS LAS POLÍTICAS RLS DE LA APLICACIÓN
-- Este script elimina y recrea todas las políticas sin recursión
-- ACTUALIZADO para coincidir con la estructura real de la BD

-- ============ CREAR TABLA PROJECT_MEMBERS SI NO EXISTE ============

-- Primero crear la tabla project_members
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Habilitar RLS para project_members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- ============ ELIMINAR TODAS LAS POLÍTICAS EXISTENTES ============

-- Eliminar políticas de projects
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios proyectos" ON projects;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios proyectos" ON projects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios proyectos" ON projects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios proyectos" ON projects;
DROP POLICY IF EXISTS "Ver proyectos donde soy miembro" ON projects;
DROP POLICY IF EXISTS "Crear proyectos" ON projects;
DROP POLICY IF EXISTS "Editar proyecto si soy dueño" ON projects;
DROP POLICY IF EXISTS "Eliminar proyecto si soy dueño" ON projects;
DROP POLICY IF EXISTS "Ver proyectos propios" ON projects;
DROP POLICY IF EXISTS "Ver proyectos como miembro" ON projects;
DROP POLICY IF EXISTS "Crear proyectos propios" ON projects;
DROP POLICY IF EXISTS "Editar proyectos propios" ON projects;
DROP POLICY IF EXISTS "Eliminar proyectos propios" ON projects;

-- Eliminar políticas de columns
DROP POLICY IF EXISTS "Usuarios pueden ver columnas de sus proyectos" ON columns;
DROP POLICY IF EXISTS "Usuarios pueden insertar columnas en sus proyectos" ON columns;
DROP POLICY IF EXISTS "Usuarios pueden actualizar columnas de sus proyectos" ON columns;
DROP POLICY IF EXISTS "Usuarios pueden eliminar columnas de sus proyectos" ON columns;
DROP POLICY IF EXISTS "Ver columnas de proyectos donde soy miembro" ON columns;
DROP POLICY IF EXISTS "Gestionar columnas si tengo permisos" ON columns;

-- Eliminar políticas de tasks
DROP POLICY IF EXISTS "Usuarios pueden ver tareas de sus proyectos" ON tasks;
DROP POLICY IF EXISTS "Usuarios pueden insertar tareas en sus proyectos" ON tasks;
DROP POLICY IF EXISTS "Usuarios pueden actualizar tareas de sus proyectos" ON tasks;
DROP POLICY IF EXISTS "Usuarios pueden eliminar tareas de sus proyectos" ON tasks;
DROP POLICY IF EXISTS "Ver tareas de proyectos donde soy miembro" ON tasks;
DROP POLICY IF EXISTS "Gestionar tareas si tengo permisos" ON tasks;

-- Eliminar políticas de task_assignments
DROP POLICY IF EXISTS "Usuarios pueden ver asignaciones de tareas de sus proyectos" ON task_assignments;
DROP POLICY IF EXISTS "Usuarios pueden insertar asignaciones de tareas en sus proyectos" ON task_assignments;
DROP POLICY IF EXISTS "Usuarios pueden eliminar asignaciones de tareas de sus proyectos" ON task_assignments;
DROP POLICY IF EXISTS "Ver asignaciones de tareas donde soy miembro del proyecto" ON task_assignments;
DROP POLICY IF EXISTS "Gestionar asignaciones si tengo permisos" ON task_assignments;

-- Eliminar políticas de project_members
DROP POLICY IF EXISTS "Ver miembros de proyectos donde soy miembro" ON project_members;
DROP POLICY IF EXISTS "Gestionar miembros si soy dueño" ON project_members;

-- Eliminar políticas de users
DROP POLICY IF EXISTS "Los usuarios pueden ver todos los perfiles" ON users;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON users;
DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio perfil" ON users;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver todos los usuarios" ON users;
DROP POLICY IF EXISTS "Usuarios pueden editar su propio perfil" ON users;

-- Eliminar políticas de project_members
DROP POLICY IF EXISTS "Ver miembros de proyectos donde soy miembro" ON public.project_members;
DROP POLICY IF EXISTS "Gestionar miembros si soy dueño" ON public.project_members;

-- Eliminar políticas de users
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver todos los usuarios" ON public.users;
DROP POLICY IF EXISTS "Usuarios pueden editar su propio perfil" ON public.users;

-- ============ CREAR NUEVAS POLÍTICAS SIN RECURSIÓN ============

-- ---- Políticas para USERS ----

-- Los usuarios autenticados pueden ver todos los usuarios (mantener políticas existentes)
CREATE POLICY "Los usuarios pueden ver todos los perfiles"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden insertar su propio perfil"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ---- Políticas para PROJECTS ----

-- Política para ver proyectos propios
CREATE POLICY "Usuarios pueden ver sus propios proyectos" 
ON projects FOR SELECT 
USING (auth.uid() = user_id);

-- Política para ver proyectos como miembro (nueva funcionalidad)
CREATE POLICY "Usuarios pueden ver proyectos donde son miembros" 
ON projects FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_members.project_id = projects.id AND project_members.user_id = auth.uid()
  )
);

-- Política para crear proyectos
CREATE POLICY "Usuarios pueden insertar sus propios proyectos" 
ON projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política para editar proyectos propios
CREATE POLICY "Usuarios pueden actualizar sus propios proyectos" 
ON projects FOR UPDATE 
USING (auth.uid() = user_id);

-- Política para eliminar proyectos propios
CREATE POLICY "Usuarios pueden eliminar sus propios proyectos" 
ON projects FOR DELETE 
USING (auth.uid() = user_id);

-- ---- Políticas para COLUMNS ----

-- Política para ver columnas como propietario del proyecto
CREATE POLICY "Usuarios pueden ver columnas de sus proyectos" 
ON columns FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = columns.project_id AND projects.user_id = auth.uid()
  )
);

-- Política para ver columnas como miembro del proyecto
CREATE POLICY "Usuarios pueden ver columnas de proyectos donde son miembros" 
ON columns FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_members.project_id = columns.project_id AND project_members.user_id = auth.uid()
  )
);

-- Política para insertar columnas si soy propietario del proyecto
CREATE POLICY "Usuarios pueden insertar columnas en sus proyectos" 
ON columns FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
);

-- Política para insertar columnas si soy miembro con permisos
CREATE POLICY "Miembros pueden insertar columnas en proyectos" 
ON columns FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_members.project_id = project_id 
    AND project_members.user_id = auth.uid() 
    AND project_members.role IN ('admin', 'member')
  )
);

-- Política para actualizar columnas si soy propietario del proyecto
CREATE POLICY "Usuarios pueden actualizar columnas de sus proyectos" 
ON columns FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
);

-- Política para actualizar columnas si soy miembro con permisos
CREATE POLICY "Miembros pueden actualizar columnas en proyectos" 
ON columns FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_members.project_id = project_id 
    AND project_members.user_id = auth.uid() 
    AND project_members.role IN ('admin', 'member')
  )
);

-- Política para eliminar columnas si soy propietario del proyecto
CREATE POLICY "Usuarios pueden eliminar columnas de sus proyectos" 
ON columns FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
);

-- Política para eliminar columnas si soy miembro con permisos admin
CREATE POLICY "Admins pueden eliminar columnas en proyectos" 
ON columns FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_members.project_id = project_id 
    AND project_members.user_id = auth.uid() 
    AND project_members.role = 'admin'
  )
);

-- ---- Políticas para TASKS ----

-- Política para ver tareas como propietario del proyecto
CREATE POLICY "Usuarios pueden ver tareas de sus proyectos" 
ON tasks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM columns 
    JOIN projects ON columns.project_id = projects.id
    WHERE columns.id = tasks.column_id AND projects.user_id = auth.uid()
  )
);

-- Política para ver tareas como miembro del proyecto
CREATE POLICY "Miembros pueden ver tareas de proyectos" 
ON tasks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM columns 
    JOIN project_members ON columns.project_id = project_members.project_id
    WHERE columns.id = tasks.column_id AND project_members.user_id = auth.uid()
  )
);

-- Política para insertar tareas si soy propietario del proyecto
CREATE POLICY "Usuarios pueden insertar tareas en sus proyectos" 
ON tasks FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM columns 
    JOIN projects ON columns.project_id = projects.id
    WHERE columns.id = column_id AND projects.user_id = auth.uid()
  )
);

-- Política para insertar tareas si soy miembro del proyecto
CREATE POLICY "Miembros pueden insertar tareas en proyectos" 
ON tasks FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM columns 
    JOIN project_members ON columns.project_id = project_members.project_id
    WHERE columns.id = column_id AND project_members.user_id = auth.uid()
  )
);

-- Política para actualizar tareas si soy propietario del proyecto
CREATE POLICY "Usuarios pueden actualizar tareas de sus proyectos" 
ON tasks FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM columns 
    JOIN projects ON columns.project_id = projects.id
    WHERE columns.id = column_id AND projects.user_id = auth.uid()
  )
);

-- Política para actualizar tareas si soy miembro del proyecto
CREATE POLICY "Miembros pueden actualizar tareas en proyectos" 
ON tasks FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM columns 
    JOIN project_members ON columns.project_id = project_members.project_id
    WHERE columns.id = column_id AND project_members.user_id = auth.uid()
  )
);

-- Política para eliminar tareas si soy propietario del proyecto
CREATE POLICY "Usuarios pueden eliminar tareas de sus proyectos" 
ON tasks FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM columns 
    JOIN projects ON columns.project_id = projects.id
    WHERE columns.id = column_id AND projects.user_id = auth.uid()
  )
);

-- Política para eliminar tareas si soy miembro con permisos admin
CREATE POLICY "Admins pueden eliminar tareas en proyectos" 
ON tasks FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM columns 
    JOIN project_members ON columns.project_id = project_members.project_id
    WHERE columns.id = column_id AND project_members.user_id = auth.uid()
    AND project_members.role = 'admin'
  )
);

-- ---- Políticas para TASK_ASSIGNMENTS ----

-- Política para ver asignaciones de tareas propias (soy el usuario asignado)
CREATE POLICY "Usuarios pueden ver sus propias asignaciones" 
ON task_assignments FOR SELECT 
USING (user_id = auth.uid());

-- Política para ver asignaciones de tareas como propietario del proyecto
CREATE POLICY "Usuarios pueden ver asignaciones de tareas de sus proyectos" 
ON task_assignments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM tasks
    JOIN columns ON tasks.column_id = columns.id
    JOIN projects ON columns.project_id = projects.id
    WHERE tasks.id = task_id AND projects.user_id = auth.uid()
  )
);

-- Política para ver asignaciones de tareas como miembro del proyecto
CREATE POLICY "Miembros pueden ver asignaciones de tareas en proyectos" 
ON task_assignments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM tasks
    JOIN columns ON tasks.column_id = columns.id
    JOIN project_members ON columns.project_id = project_members.project_id
    WHERE tasks.id = task_id AND project_members.user_id = auth.uid()
  )
);

-- Política para insertar asignaciones de tareas si soy propietario del proyecto
CREATE POLICY "Usuarios pueden insertar asignaciones de tareas en sus proyectos" 
ON task_assignments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks
    JOIN columns ON tasks.column_id = columns.id
    JOIN projects ON columns.project_id = projects.id
    WHERE tasks.id = task_id AND projects.user_id = auth.uid()
  )
);

-- Política para insertar asignaciones de tareas si soy miembro del proyecto
CREATE POLICY "Miembros pueden insertar asignaciones de tareas en proyectos" 
ON task_assignments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks
    JOIN columns ON tasks.column_id = columns.id
    JOIN project_members ON columns.project_id = project_members.project_id
    WHERE tasks.id = task_id AND project_members.user_id = auth.uid()
  )
);

-- Política para eliminar asignaciones de tareas si soy propietario del proyecto
CREATE POLICY "Usuarios pueden eliminar asignaciones de tareas de sus proyectos" 
ON task_assignments FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM tasks
    JOIN columns ON tasks.column_id = columns.id
    JOIN projects ON columns.project_id = projects.id
    WHERE tasks.id = task_id AND projects.user_id = auth.uid()
  )
);

-- Política para eliminar asignaciones de tareas si soy miembro del proyecto
CREATE POLICY "Miembros pueden eliminar asignaciones de tareas en proyectos" 
ON task_assignments FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM tasks
    JOIN columns ON tasks.column_id = columns.id
    JOIN project_members ON columns.project_id = project_members.project_id
    WHERE tasks.id = task_id AND project_members.user_id = auth.uid()
  )
);

-- Política para eliminar mis propias asignaciones
CREATE POLICY "Usuarios pueden eliminar sus propias asignaciones" 
ON task_assignments FOR DELETE 
USING (user_id = auth.uid());

-- ---- Políticas para PROJECT_MEMBERS ----

-- Política para ver miembros de proyectos propios
CREATE POLICY "Propietarios pueden ver miembros de sus proyectos" 
ON project_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
);

-- Política para ver miembros de proyectos donde soy miembro
CREATE POLICY "Miembros pueden ver otros miembros del proyecto" 
ON project_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM project_members AS pm
    WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid()
  )
);

-- Política para insertar miembros si soy propietario del proyecto
CREATE POLICY "Propietarios pueden agregar miembros a sus proyectos" 
ON project_members FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
);

-- Política para actualizar miembros si soy propietario del proyecto
CREATE POLICY "Propietarios pueden actualizar miembros de sus proyectos" 
ON project_members FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
);

-- Política para eliminar miembros si soy propietario del proyecto
CREATE POLICY "Propietarios pueden eliminar miembros de sus proyectos" 
ON project_members FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
);

-- Política para eliminarme a mí mismo como miembro (abandonar proyecto)
CREATE POLICY "Miembros pueden abandonar proyectos" 
ON project_members FOR DELETE 
USING (user_id = auth.uid());
