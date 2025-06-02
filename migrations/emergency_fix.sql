-- EMERGENCIA: Corregir recursión infinita AHORA
-- Ejecutar este script INMEDIATAMENTE en SQL Editor de Supabase

-- Eliminar la política problemática
DROP POLICY IF EXISTS "Usuarios pueden ver proyectos donde participan" ON projects;

-- Crear política simple SOLO para propietarios (temporal)
CREATE POLICY "Solo propietarios - temporal"
ON projects FOR SELECT
USING (user_id = auth.uid());

-- Esto debería detener la recursión inmediatamente
-- Después puedes ejecutar el script completo simple_fix_rls.sql
