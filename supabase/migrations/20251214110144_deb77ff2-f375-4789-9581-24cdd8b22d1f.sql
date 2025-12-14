-- Create table for tool suggestions
CREATE TABLE public.tool_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  tool_name TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'planned', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.tool_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert suggestions
CREATE POLICY "Users can insert suggestions"
  ON public.tool_suggestions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can view all suggestions
CREATE POLICY "Admins can view all suggestions"
  ON public.tool_suggestions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Users can view their own suggestions
CREATE POLICY "Users can view own suggestions"
  ON public.tool_suggestions
  FOR SELECT
  USING (user_id = auth.uid());

-- Index for faster queries
CREATE INDEX idx_tool_suggestions_status ON public.tool_suggestions(status);
CREATE INDEX idx_tool_suggestions_created_at ON public.tool_suggestions(created_at DESC);