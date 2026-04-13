-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Problem status enum
CREATE TYPE public.problem_status AS ENUM ('intake', 'solution', 'execution', 'monitoring', 'completed');

-- Root cause type enum
CREATE TYPE public.root_cause_type AS ENUM ('process', 'people', 'technology', 'external', 'resource');

-- Task status enum
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'blocked', 'paused');

-- Risk level enum
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Problems table
CREATE TABLE public.problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  context_constraints TEXT,
  desired_outcome TEXT NOT NULL,
  stakeholders TEXT[],
  current_attempts TEXT,
  status problem_status DEFAULT 'intake',
  priority_score INTEGER DEFAULT 0,
  impact_score INTEGER DEFAULT 0,
  symptoms TEXT[],
  root_causes JSONB DEFAULT '[]',
  assumptions TEXT[],
  constraints TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solutions table
CREATE TABLE public.solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  effectiveness_score INTEGER DEFAULT 0,
  speed_score INTEGER DEFAULT 0,
  cost_score INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  reversibility_score INTEGER DEFAULT 0,
  leverage_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  second_order_effects TEXT[],
  is_selected BOOLEAN DEFAULT FALSE,
  eliminated BOOLEAN DEFAULT FALSE,
  elimination_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id UUID REFERENCES public.solutions(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  status task_status DEFAULT 'pending',
  deadline TIMESTAMPTZ,
  dependencies UUID[],
  kpi_target NUMERIC,
  kpi_current NUMERIC DEFAULT 0,
  kpi_threshold NUMERIC,
  risk_level risk_level DEFAULT 'low',
  milestone TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kill switch logs table
CREATE TABLE public.kill_switch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  reason TEXT NOT NULL,
  triggered_by TEXT DEFAULT 'system',
  previous_status task_status,
  new_status task_status,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- KPIs table
CREATE TABLE public.kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  threshold_value NUMERIC,
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kill_switch_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for problems
CREATE POLICY "Users can view their own problems" ON public.problems FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create problems" ON public.problems FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own problems" ON public.problems FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own problems" ON public.problems FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all problems" ON public.problems FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for solutions
CREATE POLICY "Users can view solutions for their problems" ON public.solutions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.problems WHERE problems.id = solutions.problem_id AND problems.user_id = auth.uid()));
CREATE POLICY "Users can create solutions for their problems" ON public.solutions FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.problems WHERE problems.id = solutions.problem_id AND problems.user_id = auth.uid()));
CREATE POLICY "Users can update solutions for their problems" ON public.solutions FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.problems WHERE problems.id = solutions.problem_id AND problems.user_id = auth.uid()));
CREATE POLICY "Users can delete solutions for their problems" ON public.solutions FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.problems WHERE problems.id = solutions.problem_id AND problems.user_id = auth.uid()));

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks for their solutions" ON public.tasks FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.solutions 
    JOIN public.problems ON problems.id = solutions.problem_id 
    WHERE solutions.id = tasks.solution_id AND problems.user_id = auth.uid()
  ));
CREATE POLICY "Users can manage tasks for their solutions" ON public.tasks FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.solutions 
    JOIN public.problems ON problems.id = solutions.problem_id 
    WHERE solutions.id = tasks.solution_id AND problems.user_id = auth.uid()
  ));

-- RLS Policies for kill_switch_logs
CREATE POLICY "Users can view kill switch logs for their tasks" ON public.kill_switch_logs FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.tasks 
    JOIN public.solutions ON solutions.id = tasks.solution_id 
    JOIN public.problems ON problems.id = solutions.problem_id 
    WHERE tasks.id = kill_switch_logs.task_id AND problems.user_id = auth.uid()
  ));

-- RLS Policies for kpis
CREATE POLICY "Users can view kpis for their problems" ON public.kpis FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.problems WHERE problems.id = kpis.problem_id AND problems.user_id = auth.uid()));
CREATE POLICY "Users can manage kpis for their problems" ON public.kpis FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.problems WHERE problems.id = kpis.problem_id AND problems.user_id = auth.uid()));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON public.problems FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_kpis_updated_at BEFORE UPDATE ON public.kpis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();