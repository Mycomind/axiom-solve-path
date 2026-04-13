export type ProblemStatus = 'intake' | 'solution' | 'execution' | 'monitoring' | 'completed';
export type RootCauseType = 'process' | 'people' | 'technology' | 'external' | 'resource';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'paused';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RootCause {
  description: string;
  type: RootCauseType;
  confidence: number;
}

export interface Problem {
  id: string;
  user_id: string;
  title: string;
  problem_statement: string;
  context_constraints?: string;
  desired_outcome: string;
  stakeholders?: string[];
  current_attempts?: string;
  status: ProblemStatus;
  priority_score: number;
  impact_score: number;
  symptoms?: string[];
  root_causes: RootCause[];
  assumptions?: string[];
  constraints?: string[];
  created_at: string;
  updated_at: string;
}

export interface Solution {
  id: string;
  problem_id: string;
  title: string;
  description: string;
  effectiveness_score: number;
  speed_score: number;
  cost_score: number;
  risk_score: number;
  reversibility_score: number;
  leverage_score: number;
  total_score: number;
  second_order_effects?: string[];
  is_selected: boolean;
  eliminated: boolean;
  elimination_reason?: string;
  created_at: string;
}

export interface Task {
  id: string;
  solution_id: string;
  title: string;
  description?: string;
  owner?: string;
  status: TaskStatus;
  deadline?: string;
  dependencies?: string[];
  kpi_target?: number;
  kpi_current: number;
  kpi_threshold?: number;
  risk_level: RiskLevel;
  milestone?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface KillSwitchLog {
  id: string;
  task_id: string;
  action: string;
  reason: string;
  triggered_by: string;
  previous_status?: TaskStatus;
  new_status?: TaskStatus;
  created_at: string;
}

export interface KPI {
  id: string;
  problem_id: string;
  name: string;
  target_value: number;
  current_value: number;
  threshold_value?: number;
  unit?: string;
  created_at: string;
  updated_at: string;
}

export interface SampleProblem extends Omit<Problem, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  solutions: Omit<Solution, 'id' | 'problem_id' | 'created_at'>[];
}
