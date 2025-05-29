-- SCRIPT PARA CORREGIR LA RECURSIÓN EN POLÍTICAS DE PROJECT_MEMBERS
-- Este script elimina las políticas problemáticas y las recrea sin recursión

-- ============ ELIMINAR POLÍTICAS PROBLEMÁTICAS ============

-- Eliminar todas las políticas de project_members que pueden causar recursión
DROP POLICY IF EXISTS "Miembros pueden ver otros miembros del proyecto" ON project_members;
DROP POLICY IF EXISTS "Ver miembros de proyectos donde soy miembro" ON project_members;
DROP POLICY IF EXISTS "Gestionar miembros si soy dueño" ON project_members;

-- ============ CREAR POLÍTICAS CORREGIDAS SIN RECURSIÓN ============

-- En lugar de consultar project_members desde project_members (recursión),
-- solo permitir que los propietarios del proyecto vean los miembros
-- y que cada usuario vea solo su propia membresía

-- Política 1: Los propietarios pueden ver todos los miembros de sus proyectos
CREATE POLICY "Propietarios pueden ver miembros de sus proyectos" 
ON project_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
);

-- Política 2: Los usuarios pueden ver solo su propia membresía en proyectos
-- (esto permite que un usuario vea en qué proyectos es miembro)
CREATE POLICY "Usuarios pueden ver su propia membresía" 
ON project_members FOR SELECT 
USING (user_id = auth.uid());

-- Política 3: Solo los propietarios pueden agregar miembros
CREATE POLICY "Propietarios pueden agregar miembros a sus proyectos" 
ON project_members FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
);

-- Política 4: Solo los propietarios pueden actualizar roles de miembros
CREATE POLICY "Propietarios pueden actualizar miembros de sus proyectos" 
ON project_members FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
);

-- Política 5: Los propietarios pueden eliminar miembros Y los usuarios pueden abandonar proyectos
CREATE POLICY "Propietarios pueden eliminar miembros de sus proyectos" 
ON project_members FOR DELETE 
USING (
  -- Soy el propietario del proyecto
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
  OR
  -- O soy el usuario que quiere abandonar el proyecto
  user_id = auth.uid()
);

-- ============ VERIFICAR QUE LAS POLÍTICAS EXISTENTES NO TENGAN RECURSIÓN ============

-- Las políticas de projects que consultan project_members están bien porque:
-- - projects consulta project_members (OK)
-- - project_members NO debe consultar project_members (lo que causaba recursión)

-- Las políticas de columns, tasks, y task_assignments que consultan project_members están bien porque:
-- - Estas tablas consultan project_members (OK)
-- - project_members NO consulta estas tablas

COMMIT;
