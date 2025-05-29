-- SCRIPT COMPLETO PARA SUPABASE SQL EDITOR
-- Crear tabla project_members y políticas sin recursión

-- 1. Crear la tabla project_members si no existe
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 2. Habilitar RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas problemáticas que causan recursión
DROP POLICY IF EXISTS "Miembros pueden ver otros miembros del proyecto" ON project_members;
DROP POLICY IF EXISTS "Ver miembros de proyectos donde soy miembro" ON project_members;
DROP POLICY IF EXISTS "Gestionar miembros si soy dueño" ON project_members;
DROP POLICY IF EXISTS "Propietarios pueden ver miembros de sus proyectos" ON project_members;
DROP POLICY IF EXISTS "Usuarios pueden ver su propia membresía" ON project_members;
DROP POLICY IF EXISTS "Propietarios pueden agregar miembros a sus proyectos" ON project_members;
DROP POLICY IF EXISTS "Propietarios pueden actualizar miembros de sus proyectos" ON project_members;
DROP POLICY IF EXISTS "Propietarios pueden eliminar miembros de sus proyectos" ON project_members;
DROP POLICY IF EXISTS "Miembros pueden abandonar proyectos" ON project_members;

-- 4. Crear políticas nuevas sin recursión
CREATE POLICY "Propietarios pueden ver miembros de sus proyectos" 
ON project_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden ver su propia membresía" 
ON project_members FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Propietarios pueden agregar miembros a sus proyectos" 
ON project_members FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Propietarios pueden actualizar miembros de sus proyectos" 
ON project_members FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Propietarios pueden eliminar miembros de sus proyectos" 
ON project_members FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
  OR
  user_id = auth.uid()
);
