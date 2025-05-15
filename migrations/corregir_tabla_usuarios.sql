-- Script para corregir la tabla de usuarios y sus políticas
-- Este script corrige posibles problemas con la tabla users y sus políticas de RLS

-- 1. Verificar y corregir la tabla users
DO $$
BEGIN
    -- Verificar si la tabla users existe
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'users'
    ) THEN
        -- Crear la tabla si no existe
        CREATE TABLE public.users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT NOT NULL UNIQUE,
            name TEXT,
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
        );
        
        RAISE NOTICE 'La tabla users ha sido creada.';
    ELSE
        RAISE NOTICE 'La tabla users ya existe.';
    END IF;
    
    -- Habilitar RLS en la tabla users
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
END
$$;

-- 2. Eliminar todas las políticas existentes para la tabla users
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver todos los usuarios" ON public.users;
DROP POLICY IF EXISTS "Usuarios pueden editar su propio perfil" ON public.users;
DROP POLICY IF EXISTS "Permitir lectura de usuarios a todos los usuarios autenticados" ON public.users;
DROP POLICY IF EXISTS "Permitir a los usuarios actualizar solo sus propios datos" ON public.users;
DROP POLICY IF EXISTS "Permitir a los usuarios insertar solo sus propios datos" ON public.users;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;

-- 3. Crear nuevas políticas para la tabla users
-- Política para permitir a todos los usuarios autenticados ver todos los usuarios
CREATE POLICY "users_select_policy"
ON public.users FOR SELECT
USING (auth.role() = 'authenticated');

-- Política para permitir a los usuarios insertar solo sus propios datos
CREATE POLICY "users_insert_policy"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Política para permitir a los usuarios actualizar solo sus propios datos
CREATE POLICY "users_update_policy"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- 4. Asegurar que la función trigger para updated_at existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Asegurar que el trigger para la tabla users existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_trigger
        WHERE tgname = 'update_users_updated_at'
    ) THEN
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON public.users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        
        RAISE NOTICE 'Trigger de updated_at para users ha sido creado.';
    ELSE
        RAISE NOTICE 'Trigger de updated_at para users ya existe.';
    END IF;
END
$$;

-- 6. Diagnosticar posibles problemas de usuarios existentes
DO $$
DECLARE
    auth_users_count INTEGER;
    public_users_count INTEGER;
    missing_users_count INTEGER;
BEGIN
    -- Contar usuarios autenticados
    SELECT COUNT(*) INTO auth_users_count FROM auth.users;
    
    -- Contar usuarios en la tabla pública
    SELECT COUNT(*) INTO public_users_count FROM public.users;
    
    -- Contar usuarios autenticados sin entrada en la tabla pública
    SELECT COUNT(*) INTO missing_users_count 
    FROM auth.users a
    LEFT JOIN public.users p ON a.id = p.id
    WHERE p.id IS NULL;
    
    RAISE NOTICE 'Diagnóstico:';
    RAISE NOTICE '- Usuarios en auth.users: %', auth_users_count;
    RAISE NOTICE '- Usuarios en public.users: %', public_users_count;
    RAISE NOTICE '- Usuarios faltantes en public.users: %', missing_users_count;
    
    -- Mostrar detalles de usuarios faltantes si hay alguno
    IF missing_users_count > 0 THEN
        RAISE NOTICE 'Detalles de usuarios faltantes:';
        FOR r IN (
            SELECT a.id, a.email, a.created_at
            FROM auth.users a
            LEFT JOIN public.users p ON a.id = p.id
            WHERE p.id IS NULL
        ) LOOP
            RAISE NOTICE 'Usuario ID: %, Email: %, Creado: %', r.id, r.email, r.created_at;
        END LOOP;
    END IF;
END
$$;

-- 7. Sincronizar usuarios faltantes
DO $$
BEGIN
    INSERT INTO public.users (id, email, name, created_at, updated_at)
    SELECT 
        a.id, 
        a.email, 
        COALESCE(a.raw_user_meta_data->>'name', a.raw_user_meta_data->>'full_name', split_part(a.email, '@', 1)),
        a.created_at,
        a.last_sign_in_at
    FROM auth.users a
    LEFT JOIN public.users p ON a.id = p.id
    WHERE p.id IS NULL;
    
    GET DIAGNOSTICS rowsAffected = ROW_COUNT;
    RAISE NOTICE 'Se añadieron % usuarios faltantes a la tabla public.users', rowsAffected;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al intentar insertar usuarios faltantes: %', SQLERRM;
END
$$;
