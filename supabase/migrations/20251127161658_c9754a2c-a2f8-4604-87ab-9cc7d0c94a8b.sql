-- Create users table
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  created_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase int NOT NULL CHECK (phase >= 1 AND phase <= 4),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  leader_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  area text,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create task_completions table
CREATE TABLE public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  completed_at timestamptz DEFAULT now(),
  validated_by_leader boolean DEFAULT false,
  leader_evaluation jsonb,
  UNIQUE(task_id, user_id)
);

-- Create user_weekly_data table
CREATE TABLE public.user_weekly_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  week_start timestamptz NOT NULL,
  week_deadline timestamptz NOT NULL,
  mode text NOT NULL CHECK (mode IN ('conservador', 'moderado', 'agresivo')),
  task_limit int NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Create system_config table
CREATE TABLE public.system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_phase int NOT NULL DEFAULT 1 CHECK (current_phase >= 1 AND current_phase <= 4),
  week_start timestamptz NOT NULL DEFAULT now(),
  week_deadline timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  is_week_locked boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weekly_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for tasks table
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR leader_id = auth.uid());

CREATE POLICY "Admins can view all tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for task_completions table
CREATE POLICY "Users can view their own completions"
  ON public.task_completions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Leaders can view completions for their tasks"
  ON public.task_completions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_completions.task_id
      AND tasks.leader_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all completions"
  ON public.task_completions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own completions"
  ON public.task_completions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_weekly_data
CREATE POLICY "Users can view their own weekly data"
  ON public.user_weekly_data FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all weekly data"
  ON public.user_weekly_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own weekly data"
  ON public.user_weekly_data FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own weekly data"
  ON public.user_weekly_data FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for system_config
CREATE POLICY "Anyone can view system config"
  ON public.system_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update system config"
  ON public.system_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Insert initial system config
INSERT INTO public.system_config (current_phase, week_start, week_deadline)
VALUES (1, now(), now() + interval '7 days');

-- Insert predefined users (will be synced with auth later)
INSERT INTO public.users (username, email, full_name, role) VALUES
  ('zarko', 'zarko@experienciaselecta.com', 'Zarko', 'admin'),
  ('angel', 'angel@experienciaselecta.com', 'Ángel', 'member'),
  ('carla', 'carla@experienciaselecta.com', 'Carla', 'member'),
  ('miguel', 'miguel@experienciaselecta.com', 'Miguel', 'member'),
  ('fer', 'fer@experienciaselecta.com', 'Fer', 'member'),
  ('fernando', 'fernando@experienciaselecta.com', 'Fernando', 'member'),
  ('manu', 'manu@experienciaselecta.com', 'Manu', 'member'),
  ('casti', 'casti@experienciaselecta.com', 'Casti', 'member'),
  ('diego', 'diego@experienciaselecta.com', 'Diego', 'member');