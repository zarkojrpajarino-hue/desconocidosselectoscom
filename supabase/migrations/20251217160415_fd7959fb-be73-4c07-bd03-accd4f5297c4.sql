-- Añadir columna playbook a objectives para OKRs semanales
ALTER TABLE public.objectives 
ADD COLUMN IF NOT EXISTS playbook JSONB DEFAULT NULL;

-- Comentario explicativo
COMMENT ON COLUMN public.objectives.playbook IS 'Playbook generado por IA con pasos, tips y estrategias para alcanzar el objetivo';