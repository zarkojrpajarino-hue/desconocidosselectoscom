# Generar Tipos de Supabase

## Prerrequisitos

1. Tener el Supabase CLI instalado
2. Estar autenticado en Supabase

## Pasos para generar tipos

### Opción 1: Usando Supabase CLI (Recomendado)

```bash
# 1. Login a Supabase (solo primera vez)
npx supabase login

# 2. Link al proyecto
npx supabase link --project-ref nrsrzfqtzjrxrvqyypdn

# 3. Generar tipos
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### Opción 2: Usando la API de Supabase

```bash
# Genera tipos directamente desde el proyecto remoto
npx supabase gen types typescript --project-id nrsrzfqtzjrxrvqyypdn --schema public > src/integrations/supabase/types.ts
```

### Opción 3: Desde Supabase Dashboard (Manual)

1. Ve a: https://app.supabase.com/project/nrsrzfqtzjrxrvqyypdn/api
2. En la sección "Generate Types", copia el código TypeScript
3. Pega en `src/integrations/supabase/types.ts`

## Cuándo regenerar tipos

- Después de crear nuevas tablas
- Después de modificar columnas
- Después de cambiar relaciones (foreign keys)
- Después de aplicar migraciones importantes

## Verificación

Después de generar tipos, verifica que:

```bash
# No hay errores de TypeScript
npm run build

# Los tipos se importan correctamente
grep "import.*Database" src/**/*.ts
```

## Troubleshooting

**Error: "Not logged in"**
```bash
npx supabase login
```

**Error: "Project not found"**
- Verifica que el project-id sea correcto
- Verifica que tengas permisos en el proyecto

**Error: "Invalid schema"**
- Asegúrate de que las migraciones estén aplicadas
- Verifica en el Dashboard que las tablas existen
