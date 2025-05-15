-- SCRIPT PARA CORREGIR LA RECURSIÓN INFINITA EN LAS POLÍTICAS RLS DE PROJECTS
-- Este script elimina las políticas problemáticas y crea unas nuevas sin recursión

-- 1. Eliminar las políticas actuales de la tabla projects
DROP POLICY IF EXISTS "Ver proyectos donde soy miembro" ON public.projects;
DROP POLICY IF EXISTS "Crear proyectos" ON public.projects;
DROP POLICY IF EXISTS "Editar proyecto si soy dueño" ON public.projects;
DROP POLICY IF EXISTS "Eliminar proyecto si soy dueño" ON public.projects;

-- 2. Crear nuevas políticas sin recursión

-- Política para ver proyectos: usuario puede ver los proyectos donde es propietario o miembro
CREATE POLICY "Ver proyectos propios" 
ON public.projects FOR SELECT 
USING (auth.uid() = owner_id);

-- Política separada para ver proyectos donde se es miembro
CREATE POLICY "Ver proyectos como miembro" 
ON public.projects FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_members.project_id = projects.id AND project_members.user_id = auth.uid()
  )
);

-- Política para crear proyectos
CREATE POLICY "Crear proyectos propios" 
ON public.projects FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Política para editar proyectos propios
CREATE POLICY "Editar proyectos propios" 
ON public.projects FOR UPDATE 
USING (auth.uid() = owner_id);

-- Política para eliminar proyectos propios
CREATE POLICY "Eliminar proyectos propios" 
ON public.projects FOR DELETE 
USING (auth.uid() = owner_id);
