-- Rate limiting: AI search logs
-- Applied via Supabase MCP. This file is kept for reference.

CREATE TABLE IF NOT EXISTS public.ai_search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip text NOT NULL,
  endpoint text NOT NULL DEFAULT 'search',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_search_logs_ip_created
  ON public.ai_search_logs (ip, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_search_logs_user_created
  ON public.ai_search_logs (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.ai_search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_insert" ON public.ai_search_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_select_own" ON public.ai_search_logs
  FOR SELECT USING (user_id = auth.uid());
