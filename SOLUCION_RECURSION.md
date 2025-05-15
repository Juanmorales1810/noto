# Solución paso a paso para el error de recursión infinita

Si estás recibiendo errores como:

```
infinite recursion detected in policy for relation "projects"
```

Sigue estos pasos para solucionarlo:

## Paso 1: Identificar el problema

Este error ocurre porque hay políticas RLS (Row Level Security) en Supabase que están creando referencias circulares. Específicamente, la política "Ver proyectos donde soy miembro" está causando un ciclo de recursión.

## Paso 2: Ejecutar el script para corregir las políticas

1. Inicia sesión en tu [Dashboard de Supabase](https://app.supabase.io)
2. Selecciona tu proyecto
3. Ve a la sección "SQL Editor" en el menú lateral
4. Crea una nueva consulta haciendo clic en "New Query"
5. Copia y pega el siguiente script:

```sql
-- Eliminar las políticas problemáticas de la tabla projects
DROP POLICY IF EXISTS "Ver proyectos donde soy miembro" ON public.projects;
DROP POLICY IF EXISTS "Crear proyectos" ON public.projects;
DROP POLICY IF EXISTS "Editar proyecto si soy dueño" ON public.projects;
DROP POLICY IF EXISTS "Eliminar proyecto si soy dueño" ON public.projects;

-- Crear nuevas políticas sin recursión
-- Política para ver proyectos propios
CREATE POLICY "Ver proyectos propios"
ON public.projects FOR SELECT
USING (auth.uid() = owner_id);

-- Política para ver proyectos como miembro
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
```

6. Haz clic en "Run" para ejecutar el script

## Paso 3: Verificar que el problema se haya solucionado

1. Recarga tu aplicación
2. Intenta crear un proyecto y columnas
3. Verifica que no aparezcan más errores de recursión infinita

## Paso 4: Si el problema persiste

Si sigues viendo errores de recursión, es posible que haya problemas en otras políticas. Ejecuta el script completo que se encuentra en:

-   `INSTRUCCIONES_SUPABASE.md` en la sección "Solución completa para problemas de recursión en políticas RLS"

## ¿Por qué ocurre este error?

El error ocurre porque la política original utiliza una construcción como:

```sql
USING (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = id AND user_id = auth.uid()
  )
)
```

La referencia `project_id = id` puede causar recursión porque:

1. La tabla `projects` tiene una política que hace referencia a `project_members`
2. Para evaluar si un usuario puede ver un proyecto, Postgres debe verificar si es miembro
3. Al hacer esta verificación, puede causar un ciclo de evaluación infinito

La solución es separar esta política en dos políticas independientes:

1. Una para verificar si el usuario es propietario: `auth.uid() = owner_id`
2. Otra para verificar si es miembro: `EXISTS (SELECT ... FROM project_members ...)`

## Explicación técnica

La recursión ocurre porque las políticas RLS se evalúan recursivamente cuando hay referencias circulares. Para evitar este problema:

1. Usa nombres de columna completamente calificados (ej: `projects.id` en lugar de solo `id`)
2. Separa las condiciones compuestas (usando OR) en múltiples políticas independientes
3. Evita referencias circulares entre tablas en las políticas RLS
