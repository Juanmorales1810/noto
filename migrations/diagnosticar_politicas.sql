-- SCRIPT PARA DIAGNOSTICAR PROBLEMAS DE POLÍTICAS RLS EN SUPABASE
-- Usa este script para ver todas las políticas activas y evaluar posibles conflictos

-- Función para listar todas las políticas RLS en las tablas principales
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'DIAGNÓSTICO DE POLÍTICAS RLS EN SUPABASE';
    RAISE NOTICE '==========================================';
    
    -- Verificar si RLS está habilitado en las tablas principales
    RAISE NOTICE '';
    RAISE NOTICE 'ESTADO DE RLS EN TABLAS:';
    RAISE NOTICE '---------------------------';
    FOR r IN (
        SELECT 
            schemaname, 
            tablename, 
            rowsecurity
        FROM pg_tables 
        WHERE schemaname = 'public' AND 
              tablename IN ('users', 'projects', 'columns', 'tasks', 'task_assignments', 'project_members')
        ORDER BY tablename
    ) LOOP
        RAISE NOTICE 'Tabla: %, RLS Habilitado: %', r.tablename, r.rowsecurity;
    END LOOP;
    
    -- Listar todas las políticas en las tablas principales
    RAISE NOTICE '';
    RAISE NOTICE 'POLÍTICAS RLS ACTUALES:';
    RAISE NOTICE '---------------------------';
    FOR r IN (
        SELECT 
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies
        WHERE schemaname = 'public' AND 
              tablename IN ('users', 'projects', 'columns', 'tasks', 'task_assignments', 'project_members')
        ORDER BY tablename, policyname
    ) LOOP
        RAISE NOTICE 'Tabla: %, Política: %, Comando: %, Permisiva: %', 
            r.tablename, r.policyname, r.cmd, r.permissive;
        RAISE NOTICE '  USING: %', r.qual;
        IF r.with_check IS NOT NULL THEN
            RAISE NOTICE '  WITH CHECK: %', r.with_check;
        END IF;
        RAISE NOTICE '';
    END LOOP;
    
    -- Verificar si hay referencias circulares en las políticas (simplificado)
    RAISE NOTICE '';
    RAISE NOTICE 'POSIBLES REFERENCIAS CIRCULARES:';
    RAISE NOTICE '---------------------------';
    
    -- Buscar políticas que referencian la misma tabla en su condición
    FOR r IN (
        SELECT 
            p1.tablename, 
            p1.policyname,
            p1.qual
        FROM pg_policies p1
        WHERE p1.schemaname = 'public' 
        AND p1.tablename IN ('users', 'projects', 'columns', 'tasks', 'task_assignments', 'project_members')
        AND (
            -- Buscar referencias del mismo nombre de tabla en la condición
            p1.qual::text ILIKE '%' || p1.tablename || '%' OR
            p1.with_check::text ILIKE '%' || p1.tablename || '%'
        )
    ) LOOP
        RAISE NOTICE 'Posible auto-referencia en tabla "%" política "%"', r.tablename, r.policyname;
        RAISE NOTICE '  Condición: %', r.qual;
        RAISE NOTICE '';
    END LOOP;
    
    -- Buscar bucles en las referencias
    FOR r IN (
        WITH RECURSIVE policy_refs AS (
            SELECT 
                p1.tablename as source_table, 
                REGEXP_MATCHES(p1.qual::text, 'public\.([a-zA-Z_]+)', 'g') as target_table,
                p1.policyname,
                1 as depth,
                ARRAY[p1.tablename] as path
            FROM pg_policies p1
            WHERE p1.schemaname = 'public'
            AND p1.tablename IN ('users', 'projects', 'columns', 'tasks', 'task_assignments', 'project_members')
            
            UNION ALL
            
            SELECT 
                pr.source_table,
                REGEXP_MATCHES(p2.qual::text, 'public\.([a-zA-Z_]+)', 'g') as target_table,
                p2.policyname,
                pr.depth + 1,
                pr.path || p2.tablename
            FROM pg_policies p2
            JOIN policy_refs pr ON pr.target_table[1] = p2.tablename
            WHERE p2.schemaname = 'public'
            AND p2.tablename IN ('users', 'projects', 'columns', 'tasks', 'task_assignments', 'project_members')
            AND p2.tablename <> ALL(pr.path)
            AND pr.depth < 5 -- límite de profundidad para evitar bucles
        )
        SELECT 
            source_table,
            target_table[1],
            policyname,
            depth,
            path
        FROM policy_refs
        WHERE source_table = target_table[1] AND depth > 1
        ORDER BY source_table, depth
    ) LOOP
        RAISE NOTICE 'Ciclo detectado: % -> % (profundidad: %)', 
            r.source_table, r.target_table, r.depth;
        RAISE NOTICE '  Política: %', r.policyname;
        RAISE NOTICE '  Camino: %', r.path;
        RAISE NOTICE '';
    END LOOP;
    
    -- Consejos para solucionar problemas de recursión
    RAISE NOTICE '';
    RAISE NOTICE 'CONSEJOS PARA SOLUCIONAR PROBLEMAS DE RECURSIÓN:';
    RAISE NOTICE '----------------------------------------------';
    RAISE NOTICE '1. Separa las políticas que usan "OR" en múltiples políticas independientes';
    RAISE NOTICE '2. Evita que una política haga referencia a su propia tabla';
    RAISE NOTICE '3. Usa nombres calificados como "project_members.project_id" en lugar de solo "project_id"';
    RAISE NOTICE '4. Ejecuta el script de corrección en migrations/corregir_todas_las_politicas.sql';
    RAISE NOTICE '';
END;
$$;
