-- SCRIPT DE CORRECCIÓN: Permitir que miembros también puedan crear/editar tareas
-- Este script actualiza las políticas para hacer la aplicación verdaderamente colaborativa

-- Eliminar políticas restrictivas y crear versiones colaborativas
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;
DROP POLICY IF EXISTS "columns_insert" ON columns;
DROP POLICY IF EXISTS "columns_update" ON columns;
DROP POLICY IF EXISTS "columns_delete" ON columns;

-- Políticas para columns (propietarios Y miembros pueden crear/editar)
CREATE POLICY "columns_insert" ON columns FOR INSERT WITH CHECK (
    project_id IN (SELECT project_id FROM get_user_accessible_project_ids(auth.uid()))
);
CREATE POLICY "columns_update" ON columns FOR UPDATE USING (
    project_id IN (SELECT project_id FROM get_user_accessible_project_ids(auth.uid()))
);
CREATE POLICY "columns_delete" ON columns FOR DELETE USING (
    project_id IN (SELECT project_id FROM get_user_accessible_project_ids(auth.uid()))
);

-- Políticas para tasks (propietarios Y miembros pueden crear/editar)
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM columns c 
        WHERE c.id = column_id 
        AND c.project_id IN (SELECT project_id FROM get_user_accessible_project_ids(auth.uid()))
    )
);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM columns c 
        WHERE c.id = column_id 
        AND c.project_id IN (SELECT project_id FROM get_user_accessible_project_ids(auth.uid()))
    )
);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM columns c 
        WHERE c.id = column_id 
        AND c.project_id IN (SELECT project_id FROM get_user_accessible_project_ids(auth.uid()))
    )
);

-- También actualizar task_assignments para que miembros puedan asignar tareas
DROP POLICY IF EXISTS "task_assignments_insert" ON task_assignments;

CREATE POLICY "task_assignments_insert" ON task_assignments FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM tasks t
        JOIN columns c ON c.id = t.column_id
        WHERE t.id = task_id 
        AND c.project_id IN (SELECT project_id FROM get_user_accessible_project_ids(auth.uid()))
    )
);
