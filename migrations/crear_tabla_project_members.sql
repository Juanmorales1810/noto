-- Crear tabla project_members si no existe
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Habilitar RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Políticas para project_members
-- Política de lectura: puede ver membresías de proyectos donde es owner o miembro
CREATE POLICY "Propietarios pueden ver miembros de sus proyectos" 
ON project_members FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM projects p 
        WHERE p.id = project_id AND p.user_id = auth.uid()
    )
);

CREATE POLICY "Miembros pueden ver otros miembros del proyecto" 
ON project_members FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid()
    )
);

-- Política de inserción: solo owners pueden agregar miembros
CREATE POLICY "Propietarios pueden agregar miembros a sus proyectos" 
ON project_members FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects 
        WHERE id = project_id AND user_id = auth.uid()
    )
);

-- Política de actualización: solo owners pueden modificar roles
CREATE POLICY "Propietarios pueden actualizar miembros de sus proyectos" 
ON project_members FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM projects 
        WHERE id = project_id AND user_id = auth.uid()
    )
);

-- Política de eliminación: owners pueden eliminar miembros, miembros pueden abandonar
CREATE POLICY "Propietarios pueden eliminar miembros de sus proyectos" 
ON project_members FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM projects 
        WHERE id = project_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Miembros pueden abandonar proyectos" 
ON project_members FOR DELETE 
USING (user_id = auth.uid());

-- Comentario
COMMENT ON TABLE project_members IS 'Miembros de un proyecto y sus roles';
