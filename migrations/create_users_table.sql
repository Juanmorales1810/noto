-- Crear la tabla users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
CREATE POLICY "Permitir lectura de usuarios a todos los usuarios autenticados"
  ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir a los usuarios actualizar solo sus propios datos"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Permitir a los usuarios insertar solo sus propios datos"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Crear función para actualizar el timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para la tabla y columnas
COMMENT ON TABLE public.users IS 'Tabla que almacena la información de los usuarios del sistema Kanban';
COMMENT ON COLUMN public.users.id IS 'ID único del usuario, obtenido del sistema de autenticación de Supabase';
COMMENT ON COLUMN public.users.email IS 'Correo electrónico del usuario';
COMMENT ON COLUMN public.users.name IS 'Nombre del usuario';
COMMENT ON COLUMN public.users.avatar_url IS 'URL de la imagen de perfil del usuario';
