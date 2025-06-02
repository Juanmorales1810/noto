-- SCRIPT COMPLETO: Políticas colaborativas sin recursión
-- Este script permite acceso tanto a propietarios como a miembros

-- PASO 1: Limpiar TODAS las políticas existentes
DO $$ 
BEGIN
    -- Eliminar todas las políticas de todas las tablas
    DROP POLICY IF EXISTS "Los usuarios pueden ver todos los perfiles" ON users;
    DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON users;
    DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio perfil" ON users;
    
    DROP POLICY IF EXISTS "Usuarios pueden ver proyectos donde participan" ON projects;
    DROP POLICY IF EXISTS "Propietarios pueden ver sus proyectos" ON projects;
    DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios proyectos" ON projects;
    DROP POLICY IF EXISTS "Propietarios pueden actualizar sus proyectos" ON projects;
    DROP POLICY IF EXISTS "Propietarios pueden eliminar sus proyectos" ON projects;
    DROP POLICY IF EXISTS "projects_select_owner" ON projects;
    DROP POLICY IF EXISTS "projects_select_member" ON projects;
    DROP POLICY IF EXISTS "Solo propietarios - temporal" ON projects;
    DROP POLICY IF EXISTS "Miembros pueden ver proyectos asignados" ON projects;
    DROP POLICY IF EXISTS "projects_select" ON projects;
    DROP POLICY IF EXISTS "projects_insert" ON projects;
    DROP POLICY IF EXISTS "projects_update" ON projects;
    DROP POLICY IF EXISTS "projects_delete" ON projects;
    
    DROP POLICY IF EXISTS "Usuarios pueden ver miembros de proyectos donde participan" ON project_members;
    DROP POLICY IF EXISTS "Propietarios pueden agregar miembros a sus proyectos" ON project_members;
    DROP POLICY IF EXISTS "Propietarios pueden actualizar miembros de sus proyectos" ON project_members;
    DROP POLICY IF EXISTS "Propietarios pueden eliminar miembros de sus proyectos" ON project_members;
    DROP POLICY IF EXISTS "Miembros pueden abandonar proyectos" ON project_members;
    DROP POLICY IF EXISTS "project_members_select" ON project_members;
    DROP POLICY IF EXISTS "project_members_insert" ON project_members;
    DROP POLICY IF EXISTS "project_members_update" ON project_members;
    DROP POLICY IF EXISTS "project_members_delete" ON project_members;
    
    DROP POLICY IF EXISTS "Usuarios pueden ver columnas de sus proyectos" ON columns;
    DROP POLICY IF EXISTS "Usuarios pueden ver columnas de proyectos donde participan" ON columns;
    DROP POLICY IF EXISTS "Usuarios pueden insertar columnas en sus proyectos" ON columns;
    DROP POLICY IF EXISTS "Usuarios pueden insertar columnas en proyectos donde son propietarios" ON columns;
    DROP POLICY IF EXISTS "Usuarios pueden actualizar columnas de sus proyectos" ON columns;
    DROP POLICY IF EXISTS "Usuarios pueden actualizar columnas en proyectos donde son propietarios" ON columns;
    DROP POLICY IF EXISTS "Usuarios pueden eliminar columnas de sus proyectos" ON columns;
    DROP POLICY IF EXISTS "Usuarios pueden eliminar columnas en proyectos donde son propietarios" ON columns;
    DROP POLICY IF EXISTS "columns_select" ON columns;
    DROP POLICY IF EXISTS "columns_insert" ON columns;
    DROP POLICY IF EXISTS "columns_update" ON columns;
    DROP POLICY IF EXISTS "columns_delete" ON columns;
    
    DROP POLICY IF EXISTS "Usuarios pueden ver tareas de sus proyectos" ON tasks;
    DROP POLICY IF EXISTS "Usuarios pueden ver tareas de proyectos donde participan" ON tasks;
    DROP POLICY IF EXISTS "Usuarios pueden insertar tareas en sus proyectos" ON tasks;
    DROP POLICY IF EXISTS "Usuarios pueden insertar tareas en proyectos donde son propietarios" ON tasks;
    DROP POLICY IF EXISTS "Usuarios pueden actualizar tareas de sus proyectos" ON tasks;
    DROP POLICY IF EXISTS "Usuarios pueden actualizar tareas en proyectos donde son propietarios" ON tasks;
    DROP POLICY IF EXISTS "Usuarios pueden eliminar tareas de sus proyectos" ON tasks;
    DROP POLICY IF EXISTS "Usuarios pueden eliminar tareas en proyectos donde son propietarios" ON tasks;
    DROP POLICY IF EXISTS "tasks_select" ON tasks;
    DROP POLICY IF EXISTS "tasks_insert" ON tasks;
    DROP POLICY IF EXISTS "tasks_update" ON tasks;
    DROP POLICY IF EXISTS "tasks_delete" ON tasks;
    
    DROP POLICY IF EXISTS "Usuarios pueden ver asignaciones de tareas de sus proyectos" ON task_assignments;
    DROP POLICY IF EXISTS "Usuarios pueden ver asignaciones de tareas de proyectos donde participan" ON task_assignments;
    DROP POLICY IF EXISTS "Usuarios pueden insertar asignaciones de tareas en sus proyectos" ON task_assignments;
    DROP POLICY IF EXISTS "Usuarios pueden insertar asignaciones de tareas en proyectos donde son propietarios" ON task_assignments;
    DROP POLICY IF EXISTS "Usuarios pueden eliminar asignaciones de tareas en sus proyectos" ON task_assignments;
    DROP POLICY IF EXISTS "Usuarios pueden eliminar asignaciones de tareas en proyectos donde son propietarios" ON task_assignments;
    DROP POLICY IF EXISTS "task_assignments_select" ON task_assignments;
    DROP POLICY IF EXISTS "task_assignments_insert" ON task_assignments;
    DROP POLICY IF EXISTS "task_assignments_delete" ON task_assignments;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignorar errores si las políticas no existen
END $$;

-- PASO 2: Crear tabla temporal para proyectos accesibles (evita recursión)
DROP FUNCTION IF EXISTS get_user_accessible_project_ids(UUID);

CREATE OR REPLACE FUNCTION get_user_accessible_project_ids(user_uuid UUID)
RETURNS TABLE(project_id UUID, user_role TEXT) AS $$
BEGIN
    RETURN QUERY
    -- Proyectos propios
    SELECT p.id, 'owner'::TEXT
    FROM projects p
    WHERE p.user_id = user_uuid
    
    UNION
    
    -- Proyectos donde es miembro
    SELECT pm.project_id, 'member'::TEXT
    FROM project_members pm
    WHERE pm.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Eliminar políticas que podrían existir y crear nuevas

-- Eliminar políticas adicionales que podrían existir
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "projects_select_owner" ON projects;
DROP POLICY IF EXISTS "projects_select_member" ON projects;
DROP POLICY IF EXISTS "project_members_select" ON project_members;
DROP POLICY IF EXISTS "project_members_insert" ON project_members;
DROP POLICY IF EXISTS "project_members_update" ON project_members;
DROP POLICY IF EXISTS "project_members_delete" ON project_members;
DROP POLICY IF EXISTS "columns_select" ON columns;
DROP POLICY IF EXISTS "columns_insert" ON columns;
DROP POLICY IF EXISTS "columns_update" ON columns;
DROP POLICY IF EXISTS "columns_delete" ON columns;
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;
DROP POLICY IF EXISTS "task_assignments_select" ON task_assignments;
DROP POLICY IF EXISTS "task_assignments_insert" ON task_assignments;
DROP POLICY IF EXISTS "task_assignments_delete" ON task_assignments;

-- Políticas para users (simples)
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id);

-- Políticas para projects (propietarios + miembros sin recursión)
CREATE POLICY "projects_select_owner" ON projects FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "projects_select_member" ON projects FOR SELECT USING (
    id IN (SELECT project_id FROM get_user_accessible_project_ids(auth.uid()))
);
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Políticas para project_members (acceso simple)
CREATE POLICY "project_members_select" ON project_members FOR SELECT USING (
    project_id IN (SELECT project_id FROM get_user_accessible_project_ids(auth.uid()))
);
CREATE POLICY "project_members_insert" ON project_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);
CREATE POLICY "project_members_update" ON project_members FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);
CREATE POLICY "project_members_delete" ON project_members FOR DELETE USING (
    user_id = auth.uid() OR -- Puede eliminar su propia membresía
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()) -- O es propietario
);

-- Políticas para columns (propietarios + miembros)
CREATE POLICY "columns_select" ON columns FOR SELECT USING (
    project_id IN (SELECT project_id FROM get_user_accessible_project_ids(auth.uid()))
);
CREATE POLICY "columns_insert" ON columns FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);
CREATE POLICY "columns_update" ON columns FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);
CREATE POLICY "columns_delete" ON columns FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);

-- Políticas para tasks (propietarios + miembros)
CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM columns c 
        WHERE c.id = column_id 
        AND c.project_id IN (SELECT project_id FROM get_user_accessible_project_ids(auth.uid()))
    )
);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM columns c 
        JOIN projects p ON p.id = c.project_id 
        WHERE c.id = column_id AND p.user_id = auth.uid()
    )
);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM columns c 
        JOIN projects p ON p.id = c.project_id 
        WHERE c.id = column_id AND p.user_id = auth.uid()
    )
);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM columns c 
        JOIN projects p ON p.id = c.project_id 
        WHERE c.id = column_id AND p.user_id = auth.uid()
    )
);

-- Políticas para task_assignments (propietarios + miembros)
CREATE POLICY "task_assignments_select" ON task_assignments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM tasks t
        JOIN columns c ON c.id = t.column_id
        WHERE t.id = task_id 
        AND c.project_id IN (SELECT project_id FROM get_user_accessible_project_ids(auth.uid()))
    )
);
CREATE POLICY "task_assignments_insert" ON task_assignments FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM tasks t
        JOIN columns c ON c.id = t.column_id
        JOIN projects p ON p.id = c.project_id
        WHERE t.id = task_id AND p.user_id = auth.uid()
    )
);
CREATE POLICY "task_assignments_delete" ON task_assignments FOR DELETE USING (
    user_id = auth.uid() OR -- Puede eliminar su propia asignación
    EXISTS (
        SELECT 1 FROM tasks t
        JOIN columns c ON c.id = t.column_id
        JOIN projects p ON p.id = c.project_id
        WHERE t.id = task_id AND p.user_id = auth.uid()
    )
);

-- PASO 4: Crear vista colaborativa
DROP VIEW IF EXISTS user_accessible_projects;

CREATE OR REPLACE VIEW user_accessible_projects AS
SELECT 
    p.id,
    p.name,
    p.user_id,
    p.created_at,
    p.updated_at,
    CASE 
        WHEN p.user_id = auth.uid() THEN 'owner'::text
        ELSE 'member'::text
    END as user_role
FROM projects p
WHERE p.id IN (SELECT project_id FROM get_user_accessible_project_ids(auth.uid()));

-- Dar permisos a la vista y función
GRANT SELECT ON user_accessible_projects TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_accessible_project_ids(UUID) TO authenticated;
