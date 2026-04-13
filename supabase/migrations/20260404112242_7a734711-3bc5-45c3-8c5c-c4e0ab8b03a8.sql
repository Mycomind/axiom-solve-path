
-- 1. Add INSERT policy for kill_switch_logs
CREATE POLICY "Users can insert kill switch logs for their tasks"
ON public.kill_switch_logs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks
    JOIN solutions ON solutions.id = tasks.solution_id
    JOIN problems ON problems.id = solutions.problem_id
    WHERE tasks.id = kill_switch_logs.task_id
    AND problems.user_id = auth.uid()
  )
);

-- 2. Restrict user_roles: only admins can insert
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Restrict user_roles: only admins can update
CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Restrict user_roles: only admins can delete
CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Drop the overly broad ALL policy on user_roles and replace with admin SELECT
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
