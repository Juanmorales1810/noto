-- SCRIPT PARA ACTUALIZAR TABLAS EXISTENTES (COMPLEMENTO)
-- Este script verifica si las tablas ya existen y crea las que faltan

-- Comprobación y creación de tabla projects si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
        CREATE TABLE public.projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
        );
        
        RAISE NOTICE 'Tabla projects creada.';
        
        -- Habilitar RLS
        ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
        
        -- Crear políticas
        CREATE POLICY "Ver proyectos donde soy miembro" 
        ON public.projects FOR SELECT 
        USING (
            auth.uid() = owner_id OR 
            EXISTS (
                SELECT 1 FROM public.project_members 
                WHERE project_id = id AND user_id = auth.uid()
            )
        );

        CREATE POLICY "Crear proyectos" 
        ON public.projects FOR INSERT 
        WITH CHECK (auth.uid() = owner_id);

        CREATE POLICY "Editar proyecto si soy dueño" 
        ON public.projects FOR UPDATE 
        USING (auth.uid() = owner_id);

        CREATE POLICY "Eliminar proyecto si soy dueño" 
        ON public.projects FOR DELETE 
        USING (auth.uid() = owner_id);
        
        -- Trigger para updated_at
        CREATE TRIGGER update_projects_updated_at
        BEFORE UPDATE ON public.projects
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        
        COMMENT ON TABLE public.projects IS 'Tabla para almacenar proyectos de tipo Kanban';
    ELSE
        RAISE NOTICE 'La tabla projects ya existe.';
    END IF;
    
    -- Repetir para las demás tablas
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'columns') THEN
        CREATE TABLE public.columns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
        );
        
        RAISE NOTICE 'Tabla columns creada.';
        
        -- Habilitar RLS
        ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
        
        -- Crear políticas
        CREATE POLICY "Ver columnas de proyectos donde soy miembro" 
        ON public.columns FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.projects p
                LEFT JOIN public.project_members pm ON p.id = pm.project_id
                WHERE p.id = project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
            )
        );

        CREATE POLICY "Gestionar columnas si tengo permisos" 
        ON public.columns FOR ALL 
        USING (
            EXISTS (
                SELECT 1 FROM public.projects p
                LEFT JOIN public.project_members pm ON p.id = pm.project_id
                WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (pm.user_id = auth.uid() AND pm.role = 'admin'))
            )
        );
        
        -- Trigger para updated_at
        CREATE TRIGGER update_columns_updated_at
        BEFORE UPDATE ON public.columns
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        
        COMMENT ON TABLE public.columns IS 'Columnas del tablero Kanban (Por hacer, En progreso, Completado, etc.)';
    ELSE
        RAISE NOTICE 'La tabla columns ya existe.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
        CREATE TABLE public.tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            column_id UUID NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            position INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
        );
        
        RAISE NOTICE 'Tabla tasks creada.';
        
        -- Habilitar RLS
        ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
        
        -- Crear políticas
        CREATE POLICY "Ver tareas de proyectos donde soy miembro" 
        ON public.tasks FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.columns c
                JOIN public.projects p ON c.project_id = p.id
                LEFT JOIN public.project_members pm ON p.id = pm.project_id
                WHERE c.id = column_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
            )
        );

        CREATE POLICY "Gestionar tareas si tengo permisos" 
        ON public.tasks FOR ALL 
        USING (
            EXISTS (
                SELECT 1 FROM public.columns c
                JOIN public.projects p ON c.project_id = p.id
                LEFT JOIN public.project_members pm ON p.id = pm.project_id
                WHERE c.id = column_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
            )
        );
        
        -- Trigger para updated_at
        CREATE TRIGGER update_tasks_updated_at
        BEFORE UPDATE ON public.tasks
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        
        COMMENT ON TABLE public.tasks IS 'Tareas individuales en el tablero Kanban';
    ELSE
        RAISE NOTICE 'La tabla tasks ya existe.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_assignments') THEN
        CREATE TABLE public.task_assignments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
            UNIQUE(task_id, user_id)
        );
        
        RAISE NOTICE 'Tabla task_assignments creada.';
        
        -- Habilitar RLS
        ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
        
        -- Crear políticas
        CREATE POLICY "Ver asignaciones de tareas donde soy miembro del proyecto" 
        ON public.task_assignments FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.tasks t
                JOIN public.columns c ON t.column_id = c.id
                JOIN public.projects p ON c.project_id = p.id
                LEFT JOIN public.project_members pm ON p.id = pm.project_id
                WHERE t.id = task_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
            )
        );

        CREATE POLICY "Gestionar asignaciones si tengo permisos" 
        ON public.task_assignments FOR ALL 
        USING (
            EXISTS (
                SELECT 1 FROM public.tasks t
                JOIN public.columns c ON t.column_id = c.id
                JOIN public.projects p ON c.project_id = p.id
                LEFT JOIN public.project_members pm ON p.id = pm.project_id
                WHERE t.id = task_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
            )
        );
        
        COMMENT ON TABLE public.task_assignments IS 'Asignaciones de tareas a usuarios';
    ELSE
        RAISE NOTICE 'La tabla task_assignments ya existe.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'project_members') THEN
        CREATE TABLE public.project_members (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            role TEXT NOT NULL DEFAULT 'member',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
            UNIQUE(project_id, user_id)
        );
        
        RAISE NOTICE 'Tabla project_members creada.';
        
        -- Habilitar RLS
        ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
        
        -- Crear políticas
        CREATE POLICY "Ver miembros de proyectos donde soy miembro" 
        ON public.project_members FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.projects p
                LEFT JOIN public.project_members pm ON p.id = pm.project_id
                WHERE p.id = project_id AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
            )
        );

        CREATE POLICY "Gestionar miembros si soy dueño" 
        ON public.project_members FOR ALL 
        USING (
            EXISTS (
                SELECT 1 FROM public.projects p
                WHERE p.id = project_id AND p.owner_id = auth.uid()
            )
        );
        
        COMMENT ON TABLE public.project_members IS 'Miembros de un proyecto y sus roles';
    ELSE
        RAISE NOTICE 'La tabla project_members ya existe.';
    END IF;
END
$$;
