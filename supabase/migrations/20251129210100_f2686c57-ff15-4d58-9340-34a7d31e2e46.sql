-- Agregar campo strategic_objectives a la tabla users
ALTER TABLE public.users ADD COLUMN strategic_objectives TEXT;

-- Crear tabla para almacenar evidencias de progreso en OKRs
CREATE TABLE public.okr_evidences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  okr_update_id UUID NOT NULL REFERENCES public.okr_updates(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.okr_evidences ENABLE ROW LEVEL SECURITY;

-- Policies para okr_evidences
CREATE POLICY "Everyone can view evidences"
  ON public.okr_evidences FOR SELECT
  USING (true);

CREATE POLICY "Users can upload evidences"
  ON public.okr_evidences FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- Crear bucket de storage para evidencias de OKRs (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('okr-evidences', 'okr-evidences', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies para okr-evidences bucket
CREATE POLICY "Anyone can view OKR evidences"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'okr-evidences');

CREATE POLICY "Authenticated users can upload OKR evidences"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'okr-evidences' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own evidences"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'okr-evidences' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );