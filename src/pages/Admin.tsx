import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { SystemAnalytics } from '@/components/admin/SystemAnalytics';
import { UserManagement } from '@/components/admin/UserManagement';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalProblems: number;
  problemsCompleted: number;
  totalSolutions: number;
  totalTasks: number;
  tasksCompleted: number;
  avgCompletionTime: number;
}

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: 'admin' | 'user';
  problems_count: number;
}

interface ActivityItem {
  id: string;
  type: 'problem_created' | 'solution_selected' | 'task_completed' | 'risk_triggered';
  title: string;
  user_name: string | null;
  created_at: string;
}

export default function Admin() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch profiles with roles and problem counts
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at');

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch all problems for counting
      const { data: problems, error: problemsError } = await supabase
        .from('problems')
        .select('id, user_id, status, title, created_at');

      if (problemsError) throw problemsError;

      // Fetch all solutions
      const { data: solutions, error: solutionsError } = await supabase
        .from('solutions')
        .select('id, is_selected, problem_id, title, created_at');

      if (solutionsError) throw solutionsError;

      // Fetch all tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, status, title, created_at, solution_id');

      if (tasksError) throw tasksError;

      // Fetch kill switch logs
      const { data: killLogs, error: killLogsError } = await supabase
        .from('kill_switch_logs')
        .select('id, action, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      // Create role map
      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role as 'admin' | 'user']));

      // Create problem count map
      const problemCountMap = new Map<string, number>();
      problems?.forEach((p) => {
        problemCountMap.set(p.user_id, (problemCountMap.get(p.user_id) || 0) + 1);
      });

      // Build users with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name,
        created_at: profile.created_at || new Date().toISOString(),
        role: roleMap.get(profile.id) || 'user',
        problems_count: problemCountMap.get(profile.id) || 0,
      }));

      // Calculate stats
      const completedProblems = problems?.filter((p) => p.status === 'completed').length || 0;
      const completedTasks = tasks?.filter((t) => t.status === 'completed').length || 0;

      const systemStats: SystemStats = {
        totalUsers: profiles?.length || 0,
        activeUsers: new Set(problems?.map((p) => p.user_id)).size,
        totalProblems: problems?.length || 0,
        problemsCompleted: completedProblems,
        totalSolutions: solutions?.length || 0,
        totalTasks: tasks?.length || 0,
        tasksCompleted: completedTasks,
        avgCompletionTime: 7, // Placeholder - would need more data to calculate
      };

      // Build recent activities - get profile info for user names
      const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]));
      
      // Get problem -> user mapping
      const problemUserMap = new Map(problems?.map((p) => [p.id, p.user_id]));
      
      // Get solution -> problem mapping
      const solutionProblemMap = new Map(solutions?.map((s) => [s.id, s.problem_id]));
      
      // Get task -> solution -> problem -> user mapping
      const taskSolutionMap = new Map(tasks?.map((t) => [t.id, t.solution_id]));

      const recentActivities: ActivityItem[] = [];

      // Add recent problems
      problems?.slice(0, 5).forEach((p) => {
        recentActivities.push({
          id: `problem-${p.id}`,
          type: 'problem_created',
          title: p.title,
          user_name: profileMap.get(p.user_id) || null,
          created_at: p.created_at || new Date().toISOString(),
        });
      });

      // Add recent selected solutions
      solutions
        ?.filter((s) => s.is_selected)
        .slice(0, 5)
        .forEach((s) => {
          const problemId = s.problem_id;
          const userId = problemUserMap.get(problemId);
          recentActivities.push({
            id: `solution-${s.id}`,
            type: 'solution_selected',
            title: s.title,
            user_name: userId ? profileMap.get(userId) || null : null,
            created_at: s.created_at || new Date().toISOString(),
          });
        });

      // Add recent completed tasks
      tasks
        ?.filter((t) => t.status === 'completed')
        .slice(0, 5)
        .forEach((t) => {
          const solutionId = t.solution_id;
          const problemId = solutionProblemMap.get(solutionId);
          const userId = problemId ? problemUserMap.get(problemId) : undefined;
          recentActivities.push({
            id: `task-${t.id}`,
            type: 'task_completed',
            title: t.title,
            user_name: userId ? profileMap.get(userId) || null : null,
            created_at: t.created_at || new Date().toISOString(),
          });
        });

      // Add kill switch logs
      killLogs?.forEach((log) => {
        recentActivities.push({
          id: `risk-${log.id}`,
          type: 'risk_triggered',
          title: `Kill switch: ${log.action}`,
          user_name: null,
          created_at: log.created_at || new Date().toISOString(),
        });
      });

      // Sort by date
      recentActivities.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setStats(systemStats);
      setUsers(usersWithRoles);
      setActivities(recentActivities.slice(0, 20));
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
              <Shield className="w-7 sm:w-8 h-7 sm:h-8 text-primary" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              System-wide analytics, user management, and role controls
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="gap-2 self-start sm:self-auto"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </motion.div>

        {/* Content */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-muted/30">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <SystemAnalytics stats={stats} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement users={users} isLoading={isLoading} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="activity">
            <RecentActivity activities={activities} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
