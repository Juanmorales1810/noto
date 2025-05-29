-- SCRIPT PARA CORREGIR RECURSIÓN EN PROJECT_MEMBERS (COPIAR EN SUPABASE SQL EDITOR)

-- 1. Eliminar políticas problemáticas que causan recursión
DROP POLICY IF EXISTS "Miembros pueden ver otros miembros del proyecto" ON project_members;
DROP POLICY IF EXISTS "Ver miembros de proyectos donde soy miembro" ON project_members;
DROP POLICY IF EXISTS "Gestionar miembros si soy dueño" ON project_members;

-- 2. Crear políticas sin recursión
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
