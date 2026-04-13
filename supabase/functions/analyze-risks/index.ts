import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  milestone: string | null;
  owner: string | null;
  deadline: string | null;
  risk_level: string;
  kpi_current: number | null;
  kpi_target: number | null;
  kpi_threshold: number | null;
  dependencies: string[] | null;
}

interface RiskAnalysis {
  alerts: Array<{
    level: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    taskId: string;
    taskTitle: string;
    recommendedAction: 'pause' | 'escalate' | 'reallocate' | 'monitor';
  }>;
  killSwitchActions: Array<{
    taskId: string;
    taskTitle: string;
    action: 'paused' | 'escalated' | 'reallocated';
    reason: string;
    newStatus?: string;
  }>;
  overallRiskScore: number;
  summary: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { solutionId, tasks, problemContext, autoExecute = false } = await req.json();

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ 
          analysis: { 
            alerts: [], 
            killSwitchActions: [], 
            overallRiskScore: 0,
            summary: 'No tasks to analyze'
          } 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing risks for ${tasks.length} tasks`);

    const systemPrompt = `You are an expert risk analyst and project manager for a problem-solving execution system.
Your role is to analyze tasks and their KPIs to identify risks and recommend automated kill-switch actions.

KILL-SWITCH RULES:
1. CRITICAL - KPI Threshold Breach: If a task's current KPI value breaches the threshold (exceeds for negative metrics, falls below for positive metrics), recommend ESCALATE
2. HIGH - Deadline Risk: If a task is blocked or behind schedule with an approaching deadline, recommend PAUSE or ESCALATE
3. MEDIUM - Resource Conflict: If multiple high-risk tasks share the same owner, recommend REALLOCATE
4. LOW - Monitoring: If metrics are trending toward threshold but not yet breached, recommend MONITOR

Risk Level Criteria:
- CRITICAL: KPI breached threshold, immediate action required
- HIGH: KPI within 10% of threshold, or task blocked with upcoming deadline
- MEDIUM: Task at risk but recoverable, or resource conflicts detected
- LOW: Minor issues, continue monitoring

You must analyze each task and:
1. Identify any active risks based on KPI values vs thresholds
2. Flag deadline risks for blocked/in_progress tasks
3. Detect resource conflicts (same owner on multiple high-risk tasks)
4. Recommend specific kill-switch actions when thresholds are breached`;

    const userPrompt = `Analyze these tasks for risks and recommend kill-switch actions:

PROBLEM CONTEXT:
${problemContext || 'General project execution'}

TASKS TO ANALYZE:
${JSON.stringify(tasks, null, 2)}

Analyze each task and provide:
1. Active alerts with severity levels
2. Recommended kill-switch actions for any threshold breaches
3. Overall risk score (0-100)
4. Brief summary of the risk landscape`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai-gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_risks',
              description: 'Analyze task risks and recommend kill-switch actions',
              parameters: {
                type: 'object',
                properties: {
                  alerts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        level: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                        title: { type: 'string', description: 'Short alert title' },
                        description: { type: 'string', description: 'Detailed description with specific values' },
                        taskId: { type: 'string', description: 'ID of the affected task' },
                        taskTitle: { type: 'string', description: 'Title of the affected task' },
                        recommendedAction: { type: 'string', enum: ['pause', 'escalate', 'reallocate', 'monitor'] }
                      },
                      required: ['level', 'title', 'description', 'taskId', 'taskTitle', 'recommendedAction']
                    }
                  },
                  killSwitchActions: {
                    type: 'array',
                    description: 'Actions to execute automatically when thresholds are breached',
                    items: {
                      type: 'object',
                      properties: {
                        taskId: { type: 'string' },
                        taskTitle: { type: 'string' },
                        action: { type: 'string', enum: ['paused', 'escalated', 'reallocated'] },
                        reason: { type: 'string', description: 'Specific reason with KPI values' },
                        newStatus: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'blocked', 'paused'] }
                      },
                      required: ['taskId', 'taskTitle', 'action', 'reason']
                    }
                  },
                  overallRiskScore: {
                    type: 'number',
                    description: 'Overall risk score from 0 (no risk) to 100 (critical)'
                  },
                  summary: {
                    type: 'string',
                    description: 'Brief summary of the risk landscape'
                  }
                },
                required: ['alerts', 'killSwitchActions', 'overallRiskScore', 'summary']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_risks' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const analysis: RiskAnalysis = JSON.parse(toolCall.function.arguments);
    console.log('Risk analysis complete:', JSON.stringify(analysis, null, 2));

    // Auto-execute kill-switch actions if enabled
    if (autoExecute && analysis.killSwitchActions.length > 0) {
      console.log('Auto-executing kill-switch actions...');
      
      for (const action of analysis.killSwitchActions) {
        // Get current task status
        const { data: currentTask } = await supabase
          .from('tasks')
          .select('status')
          .eq('id', action.taskId)
          .single();

        const previousStatus = currentTask?.status || 'pending';
        const newStatus = action.action === 'paused' ? 'paused' : 
                         action.action === 'escalated' ? 'blocked' : previousStatus;

        // Update task status
        await supabase
          .from('tasks')
          .update({ 
            status: newStatus,
            risk_level: action.action === 'escalated' ? 'critical' : 'high'
          })
          .eq('id', action.taskId);

        // Log the kill-switch action
        await supabase
          .from('kill_switch_logs')
          .insert({
            task_id: action.taskId,
            action: action.action,
            reason: action.reason,
            previous_status: previousStatus,
            new_status: newStatus,
            triggered_by: 'system'
          });

        console.log(`Kill-switch executed: ${action.action} on task ${action.taskId}`);
      }
    }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in analyze-risks:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
