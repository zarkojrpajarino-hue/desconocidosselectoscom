-- Tabla de puntos y logros de usuarios
CREATE TABLE user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  total_points int DEFAULT 0,
  current_streak int DEFAULT 0,
  best_streak int DEFAULT 0,
  tasks_completed_total int DEFAULT 0,
  tasks_validated_total int DEFAULT 0,
  perfect_weeks int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabla de badges
CREATE TABLE badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(50) UNIQUE NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  icon_emoji varchar(10),
  points_required int,
  category varchar(50),
  rarity varchar(20),
  created_at timestamptz DEFAULT now()
);

-- Tabla de badges obtenidos por usuarios
CREATE TABLE user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  metadata jsonb,
  UNIQUE(user_id, badge_id)
);

-- Tabla de historial de puntos
CREATE TABLE points_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  points int NOT NULL,
  reason varchar(100),
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Insertar badges iniciales
INSERT INTO badges (code, name, description, icon_emoji, points_required, category, rarity) VALUES
-- COMPLETION BADGES
('first_task', 'Primera Tarea', 'Completaste tu primera tarea', '🎯', 10, 'completion', 'common'),
('task_master_10', 'Maestro de Tareas', 'Completaste 10 tareas', '⭐', 100, 'completion', 'common'),
('task_legend_50', 'Leyenda de Tareas', 'Completaste 50 tareas', '🏆', 500, 'completion', 'rare'),
('task_god_100', 'Dios de las Tareas', 'Completaste 100 tareas', '👑', 1000, 'completion', 'epic'),

-- STREAK BADGES
('streak_3', 'En Racha', '3 semanas consecutivas >80%', '🔥', 150, 'streak', 'common'),
('streak_5', 'Imparable', '5 semanas consecutivas >80%', '💪', 300, 'streak', 'rare'),
('streak_10', 'Leyenda Viviente', '10 semanas consecutivas >80%', '🌟', 1000, 'streak', 'epic'),
('streak_20', 'Inmortal', '20 semanas consecutivas >80%', '⚡', 3000, 'streak', 'legendary'),

-- LEADERSHIP BADGES
('validator_10', 'Líder Atento', 'Validaste 10 tareas', '✅', 100, 'leadership', 'common'),
('validator_50', 'Líder Comprometido', 'Validaste 50 tareas', '🎖️', 500, 'leadership', 'rare'),
('perfect_feedback', 'Feedback de Oro', 'Recibiste valoración 5⭐ en 10 tareas', '🌟', 300, 'leadership', 'rare'),

-- COLLABORATION BADGES
('team_player', 'Jugador de Equipo', 'Trabajaste con 5 personas diferentes', '🤝', 200, 'collaboration', 'common'),
('mentor', 'Mentor', 'Ayudaste a 3 personas a completar tareas', '🎓', 400, 'collaboration', 'rare'),

-- SPECIAL BADGES
('perfect_week', 'Semana Perfecta', '100% de tareas completadas en una semana', '💎', 500, 'completion', 'epic'),
('early_bird', 'Madrugador', 'Completaste tareas antes de las 9 AM en 5 ocasiones', '🌅', 150, 'completion', 'rare'),
('night_owl', 'Búho Nocturno', 'Completaste tareas después de las 10 PM en 5 ocasiones', '🦉', 150, 'completion', 'rare');

-- Índices para performance
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_points_history_user_id ON points_history(user_id);
CREATE INDEX idx_user_achievements_total_points ON user_achievements(total_points DESC);

-- RLS Policies
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- Users can view all badges
CREATE POLICY "Anyone can view badges"
ON badges FOR SELECT
USING (true);

-- Users can view their own achievements
CREATE POLICY "Users can view their own achievements"
ON user_achievements FOR SELECT
USING (user_id = auth.uid());

-- Admins can view all achievements
CREATE POLICY "Admins can view all achievements"
ON user_achievements FOR SELECT
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- System can insert/update achievements
CREATE POLICY "System can manage achievements"
ON user_achievements FOR ALL
USING (true)
WITH CHECK (true);

-- Users can view their own badges
CREATE POLICY "Users can view their own badges"
ON user_badges FOR SELECT
USING (user_id = auth.uid());

-- Users can view all user badges (for leaderboard)
CREATE POLICY "Users can view all badges"
ON user_badges FOR SELECT
USING (true);

-- System can insert badges
CREATE POLICY "System can insert user badges"
ON user_badges FOR INSERT
WITH CHECK (true);

-- Users can view their own points history
CREATE POLICY "Users can view their own points"
ON points_history FOR SELECT
USING (user_id = auth.uid());

-- System can insert points
CREATE POLICY "System can insert points"
ON points_history FOR INSERT
WITH CHECK (true);