-- SCRIPT COMPLETO: Crear vista para proyectos con membresías
-- Este script resuelve el error 404 creando la vista user_accessible_projects

-- Crear vista para proyectos accesibles por el usuario (evita recursión en políticas)
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
WHERE 
    p.user_id = auth.uid()  -- Es propietario del proyecto
    OR EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
    );  -- Es miembro del proyecto

-- Dar permisos a la vista
GRANT SELECT ON user_accessible_projects TO authenticated;

-- Comentario
COMMENT ON VIEW user_accessible_projects IS 'Vista que muestra todos los proyectos accesibles por el usuario actual, incluyendo su rol';
