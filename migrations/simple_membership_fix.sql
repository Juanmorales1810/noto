-- SCRIPT EMERGENCIA: Eliminar todas las políticas problemáticas y crear versiones simples
-- Este script resuelve la recursión infinita

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
    
    DROP POLICY IF EXISTS "Usuarios pueden ver miembros de proyectos donde participan" ON project_members;
    DROP POLICY IF EXISTS "Propietarios pueden agregar miembros a sus proyectos" ON project_members;
    DROP POLICY IF EXISTS "Propietarios pueden actualizar miembros de sus proyectos" ON project_members;
    DROP POLICY IF EXISTS "Propietarios pueden eliminar miembros de sus proyectos" ON project_members;
    DROP POLICY IF EXISTS "Miembros pueden abandonar proyectos" ON project_members;
    
    DROP POLICY IF EXISTS "Usuarios pueden ver columnas de sus proyectos" ON columns;
    DROP POLICY IF EXISTS "Usuarios pueden ver columnas de proyectos donde participan" ON columns;
    DROP POLICY IF EXISTS "Usuarios pueden insertar columnas en sus proyectos" ON columns;
    DROP POLICY IF EXISTS "Usuarios pueden insertar columnas en proyectos donde son propietarios" ON columns;
    DROP POLICY IF EXISTS "Usuarios pueden actualizar columnas de sus proyectos" ON columns;
    DROP POLICY IF EXISTS "Usuarios pueden actualizar columnas en proyectos donde son propietarios" ON columns;
    DROP POLICY IF EXISTS "Usuarios pueden eliminar columnas de sus proyectos" ON columns;
    DROP POLICY IF EXISTS "Usuarios pueden eliminar columnas en proyectos donde son propietarios" ON columns;
    
    DROP POLICY IF EXISTS "Usuarios pueden ver tareas de sus proyectos" ON tasks;
    DROP POLICY IF EXISTS "Usuarios pueden ver tareas de proyectos donde participan" ON tasks;
    DROP POLICY IF EXISTS "Usuarios pueden insertar tareas en sus proyectos" ON tasks;
    DROP POLICY IF EXISTS "Usuarios pueden insertar tareas en proyectos donde son propietarios" ON tasks;
    DROP POLICY IF EXISTS "Usuarios pueden actualizar tareas de sus proyectos" ON tasks;
    DROP POLICY IF EXISTS "Usuarios pueden actualizar tareas en proyectos donde son propietarios" ON tasks;
    DROP POLICY IF EXISTS "Usuarios pueden eliminar tareas de sus proyectos" ON tasks;
    DROP POLICY IF EXISTS "Usuarios pueden eliminar tareas en proyectos donde son propietarios" ON tasks;
    
    DROP POLICY IF EXISTS "Usuarios pueden ver asignaciones de tareas de sus proyectos" ON task_assignments;
    DROP POLICY IF EXISTS "Usuarios pueden ver asignaciones de tareas de proyectos donde participan" ON task_assignments;
    DROP POLICY IF EXISTS "Usuarios pueden insertar asignaciones de tareas en sus proyectos" ON task_assignments;
    DROP POLICY IF EXISTS "Usuarios pueden insertar asignaciones de tareas en proyectos donde son propietarios" ON task_assignments;
    DROP POLICY IF EXISTS "Usuarios pueden eliminar asignaciones de tareas en sus proyectos" ON task_assignments;
    DROP POLICY IF EXISTS "Usuarios pueden eliminar asignaciones de tareas en proyectos donde son propietarios" ON task_assignments;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignorar errores si las políticas no existen
END $$;

-- PASO 2: Crear políticas simples sin recursión

-- Políticas para users (simples)
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id);

-- Políticas para projects (solo propietarios)
CREATE POLICY "projects_select" ON projects FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Políticas para project_members (muy simples)
CREATE POLICY "project_members_select" ON project_members FOR SELECT USING (true);
CREATE POLICY "project_members_insert" ON project_members FOR INSERT WITH CHECK (true);
CREATE POLICY "project_members_update" ON project_members FOR UPDATE USING (true);
CREATE POLICY "project_members_delete" ON project_members FOR DELETE USING (true);

-- Políticas para columns (solo para propietarios del proyecto)
CREATE POLICY "columns_select" ON columns FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE id = columns.project_id AND user_id = auth.uid())
);
CREATE POLICY "columns_insert" ON columns FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE id = columns.project_id AND user_id = auth.uid())
);
CREATE POLICY "columns_update" ON columns FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE id = columns.project_id AND user_id = auth.uid())
);
CREATE POLICY "columns_delete" ON columns FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE id = columns.project_id AND user_id = auth.uid())
);

-- Políticas para tasks (solo para propietarios del proyecto)
CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM columns c 
        JOIN projects p ON p.id = c.project_id 
        WHERE c.id = tasks.column_id AND p.user_id = auth.uid()
    )
);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM columns c 
        JOIN projects p ON p.id = c.project_id 
        WHERE c.id = tasks.column_id AND p.user_id = auth.uid()
    )
);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM columns c 
        JOIN projects p ON p.id = c.project_id 
        WHERE c.id = tasks.column_id AND p.user_id = auth.uid()
    )
);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM columns c 
        JOIN projects p ON p.id = c.project_id 
        WHERE c.id = tasks.column_id AND p.user_id = auth.uid()
    )
);

-- Políticas para task_assignments (solo para propietarios del proyecto)
CREATE POLICY "task_assignments_select" ON task_assignments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM tasks t
        JOIN columns c ON c.id = t.column_id
        JOIN projects p ON p.id = c.project_id
        WHERE t.id = task_assignments.task_id AND p.user_id = auth.uid()
    )
);
CREATE POLICY "task_assignments_insert" ON task_assignments FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM tasks t
        JOIN columns c ON c.id = t.column_id
        JOIN projects p ON p.id = c.project_id
        WHERE t.id = task_assignments.task_id AND p.user_id = auth.uid()
    )
);
CREATE POLICY "task_assignments_delete" ON task_assignments FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM tasks t
        JOIN columns c ON c.id = t.column_id
        JOIN projects p ON p.id = c.project_id
        WHERE t.id = task_assignments.task_id AND p.user_id = auth.uid()
    )
);

-- PASO 3: Crear vista sin recursión
CREATE OR REPLACE VIEW user_accessible_projects AS
SELECT 
    p.id,
    p.name,
    p.user_id,
    p.created_at,
    p.updated_at,
    'owner'::text as user_role
FROM projects p
WHERE p.user_id = auth.uid();

-- Dar permisos a la vista
GRANT SELECT ON user_accessible_projects TO authenticated;
