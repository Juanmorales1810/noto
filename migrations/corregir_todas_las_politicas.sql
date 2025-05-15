-- SCRIPT PARA CORREGIR TODAS LAS POLÍTICAS RLS DE LA APLICACIÓN
-- Este script elimina y recrea todas las políticas sin recursión

-- ============ ELIMINAR TODAS LAS POLÍTICAS EXISTENTES ============

-- Eliminar políticas de projects
DROP POLICY IF EXISTS "Ver proyectos donde soy miembro" ON public.projects;
DROP POLICY IF EXISTS "Crear proyectos" ON public.projects;
DROP POLICY IF EXISTS "Editar proyecto si soy dueño" ON public.projects;
DROP POLICY IF EXISTS "Eliminar proyecto si soy dueño" ON public.projects;
DROP POLICY IF EXISTS "Ver proyectos propios" ON public.projects;
DROP POLICY IF EXISTS "Ver proyectos como miembro" ON public.projects;
DROP POLICY IF EXISTS "Crear proyectos propios" ON public.projects;
DROP POLICY IF EXISTS "Editar proyectos propios" ON public.projects;
DROP POLICY IF EXISTS "Eliminar proyectos propios" ON public.projects;

-- Eliminar políticas de columns
DROP POLICY IF EXISTS "Ver columnas de proyectos donde soy miembro" ON public.columns;
DROP POLICY IF EXISTS "Gestionar columnas si tengo permisos" ON public.columns;

-- Eliminar políticas de tasks
DROP POLICY IF EXISTS "Ver tareas de proyectos donde soy miembro" ON public.tasks;
DROP POLICY IF EXISTS "Gestionar tareas si tengo permisos" ON public.tasks;

-- Eliminar políticas de task_assignments
DROP POLICY IF EXISTS "Ver asignaciones de tareas donde soy miembro del proyecto" ON public.task_assignments;
DROP POLICY IF EXISTS "Gestionar asignaciones si tengo permisos" ON public.task_assignments;

-- Eliminar políticas de project_members
DROP POLICY IF EXISTS "Ver miembros de proyectos donde soy miembro" ON public.project_members;
DROP POLICY IF EXISTS "Gestionar miembros si soy dueño" ON public.project_members;

-- Eliminar políticas de users
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver todos los usuarios" ON public.users;
DROP POLICY IF EXISTS "Usuarios pueden editar su propio perfil" ON public.users;

-- ============ CREAR NUEVAS POLÍTICAS SIN RECURSIÓN ============

-- ---- Políticas para USERS ----

-- Los usuarios autenticados pueden ver todos los usuarios
CREATE POLICY "users_select_policy" 
ON public.users FOR SELECT 
USING (auth.role() = 'authenticated');

-- Los usuarios solo pueden editar su propio perfil
CREATE POLICY "users_update_policy" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Los usuarios pueden insertar su propio perfil
CREATE POLICY "users_insert_policy" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- ---- Políticas para PROJECTS ----

-- Política para ver proyectos propios
CREATE POLICY "projects_select_owner_policy" 
ON public.projects FOR SELECT 
USING (auth.uid() = owner_id);

-- Política para ver proyectos como miembro (separada para evitar recursión)
CREATE POLICY "projects_select_member_policy" 
ON public.projects FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_members.project_id = projects.id AND project_members.user_id = auth.uid()
  )
);

-- Política para crear proyectos
CREATE POLICY "projects_insert_policy" 
ON public.projects FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Política para editar proyectos propios
CREATE POLICY "projects_update_policy" 
ON public.projects FOR UPDATE 
USING (auth.uid() = owner_id);

-- Política para eliminar proyectos propios
CREATE POLICY "projects_delete_policy" 
ON public.projects FOR DELETE 
USING (auth.uid() = owner_id);

-- ---- Políticas para COLUMNS ----

-- Política para ver columnas como propietario del proyecto
CREATE POLICY "columns_select_owner_policy" 
ON public.columns FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = columns.project_id AND projects.owner_id = auth.uid()
  )
);

-- Política para ver columnas como miembro del proyecto
CREATE POLICY "columns_select_member_policy" 
ON public.columns FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_members.project_id = columns.project_id AND project_members.user_id = auth.uid()
  )
);

-- Política para insertar columnas si soy propietario del proyecto
CREATE POLICY "columns_insert_owner_policy" 
ON public.columns FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_id AND projects.owner_id = auth.uid()
  )
);

-- Política para insertar columnas si soy miembro con permisos
CREATE POLICY "columns_insert_member_policy" 
ON public.columns FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_members.project_id = project_id 
    AND project_members.user_id = auth.uid() 
    AND project_members.role IN ('admin')
  )
);

-- Política para actualizar columnas si soy propietario del proyecto
CREATE POLICY "columns_update_owner_policy" 
ON public.columns FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_id AND projects.owner_id = auth.uid()
  )
);

-- Política para actualizar columnas si soy miembro con permisos
CREATE POLICY "columns_update_member_policy" 
ON public.columns FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_members.project_id = project_id 
    AND project_members.user_id = auth.uid() 
    AND project_members.role IN ('admin')
  )
);

-- Política para eliminar columnas si soy propietario del proyecto
CREATE POLICY "columns_delete_owner_policy" 
ON public.columns FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_id AND projects.owner_id = auth.uid()
  )
);

-- Política para eliminar columnas si soy miembro con permisos
CREATE POLICY "columns_delete_member_policy" 
ON public.columns FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_members.project_id = project_id 
    AND project_members.user_id = auth.uid() 
    AND project_members.role IN ('admin')
  )
);

-- ---- Políticas para TASKS ----

-- Política para ver tareas como propietario del proyecto
CREATE POLICY "tasks_select_owner_policy" 
ON public.tasks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.columns 
    JOIN public.projects ON columns.project_id = projects.id
    WHERE columns.id = tasks.column_id AND projects.owner_id = auth.uid()
  )
);

-- Política para ver tareas como miembro del proyecto
CREATE POLICY "tasks_select_member_policy" 
ON public.tasks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.columns 
    JOIN public.project_members ON columns.project_id = project_members.project_id
    WHERE columns.id = tasks.column_id AND project_members.user_id = auth.uid()
  )
);

-- Política para insertar tareas si soy propietario del proyecto
CREATE POLICY "tasks_insert_owner_policy" 
ON public.tasks FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.columns 
    JOIN public.projects ON columns.project_id = projects.id
    WHERE columns.id = column_id AND projects.owner_id = auth.uid()
  )
);

-- Política para insertar tareas si soy miembro del proyecto
CREATE POLICY "tasks_insert_member_policy" 
ON public.tasks FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.columns 
    JOIN public.project_members ON columns.project_id = project_members.project_id
    WHERE columns.id = column_id AND project_members.user_id = auth.uid()
  )
);

-- Política para actualizar tareas si soy propietario del proyecto
CREATE POLICY "tasks_update_owner_policy" 
ON public.tasks FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.columns 
    JOIN public.projects ON columns.project_id = projects.id
    WHERE columns.id = column_id AND projects.owner_id = auth.uid()
  )
);

-- Política para actualizar tareas si soy miembro del proyecto
CREATE POLICY "tasks_update_member_policy" 
ON public.tasks FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.columns 
    JOIN public.project_members ON columns.project_id = project_members.project_id
    WHERE columns.id = column_id AND project_members.user_id = auth.uid()
  )
);

-- Política para eliminar tareas si soy propietario del proyecto
CREATE POLICY "tasks_delete_owner_policy" 
ON public.tasks FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.columns 
    JOIN public.projects ON columns.project_id = projects.id
    WHERE columns.id = column_id AND projects.owner_id = auth.uid()
  )
);

-- Política para eliminar tareas si soy miembro del proyecto
CREATE POLICY "tasks_delete_member_policy" 
ON public.tasks FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.columns 
    JOIN public.project_members ON columns.project_id = project_members.project_id
    WHERE columns.id = column_id AND project_members.user_id = auth.uid()
  )
);

-- ---- Políticas para TASK_ASSIGNMENTS ----

-- Política para ver asignaciones de tareas propias (soy el usuario asignado)
CREATE POLICY "task_assignments_select_self_policy" 
ON public.task_assignments FOR SELECT 
USING (user_id = auth.uid());

-- Política para ver asignaciones de tareas como propietario del proyecto
CREATE POLICY "task_assignments_select_owner_policy" 
ON public.task_assignments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks
    JOIN public.columns ON tasks.column_id = columns.id
    JOIN public.projects ON columns.project_id = projects.id
    WHERE tasks.id = task_id AND projects.owner_id = auth.uid()
  )
);

-- Política para ver asignaciones de tareas como miembro del proyecto
CREATE POLICY "task_assignments_select_member_policy" 
ON public.task_assignments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks
    JOIN public.columns ON tasks.column_id = columns.id
    JOIN public.project_members ON columns.project_id = project_members.project_id
    WHERE tasks.id = task_id AND project_members.user_id = auth.uid()
  )
);

-- Política para insertar asignaciones de tareas si soy propietario del proyecto
CREATE POLICY "task_assignments_insert_owner_policy" 
ON public.task_assignments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks
    JOIN public.columns ON tasks.column_id = columns.id
    JOIN public.projects ON columns.project_id = projects.id
    WHERE tasks.id = task_id AND projects.owner_id = auth.uid()
  )
);

-- Política para insertar asignaciones de tareas si soy miembro del proyecto
CREATE POLICY "task_assignments_insert_member_policy" 
ON public.task_assignments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks
    JOIN public.columns ON tasks.column_id = columns.id
    JOIN public.project_members ON columns.project_id = project_members.project_id
    WHERE tasks.id = task_id AND project_members.user_id = auth.uid()
  )
);

-- Política para eliminar asignaciones de tareas si soy propietario del proyecto
CREATE POLICY "task_assignments_delete_owner_policy" 
ON public.task_assignments FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks
    JOIN public.columns ON tasks.column_id = columns.id
    JOIN public.projects ON columns.project_id = projects.id
    WHERE tasks.id = task_id AND projects.owner_id = auth.uid()
  )
);

-- Política para eliminar asignaciones de tareas si soy miembro del proyecto
CREATE POLICY "task_assignments_delete_member_policy" 
ON public.task_assignments FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks
    JOIN public.columns ON tasks.column_id = columns.id
    JOIN public.project_members ON columns.project_id = project_members.project_id
    WHERE tasks.id = task_id AND project_members.user_id = auth.uid()
  )
);

-- Política para eliminar mis propias asignaciones
CREATE POLICY "task_assignments_delete_self_policy" 
ON public.task_assignments FOR DELETE 
USING (user_id = auth.uid());

-- ---- Políticas para PROJECT_MEMBERS ----

-- Política para ver miembros de proyectos propios
CREATE POLICY "project_members_select_owner_policy" 
ON public.project_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_id AND projects.owner_id = auth.uid()
  )
);

-- Política para ver miembros de proyectos donde soy miembro
CREATE POLICY "project_members_select_member_policy" 
ON public.project_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members AS pm
    WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid()
  )
);

-- Política para insertar miembros si soy propietario del proyecto
CREATE POLICY "project_members_insert_owner_policy" 
ON public.project_members FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_id AND projects.owner_id = auth.uid()
  )
);

-- Política para actualizar miembros si soy propietario del proyecto
CREATE POLICY "project_members_update_owner_policy" 
ON public.project_members FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_id AND projects.owner_id = auth.uid()
  )
);

-- Política para eliminar miembros si soy propietario del proyecto
CREATE POLICY "project_members_delete_owner_policy" 
ON public.project_members FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_id AND projects.owner_id = auth.uid()
  )
);

-- Política para eliminarme a mí mismo como miembro (abandonar proyecto)
CREATE POLICY "project_members_delete_self_policy" 
ON public.project_members FOR DELETE 
USING (user_id = auth.uid());
