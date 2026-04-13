import { SampleProblem, Task, KPI } from '@/types';

export const sampleProblems: SampleProblem[] = [
  {
    title: "Customer Churn Rate Exceeds Target by 40%",
    problem_statement: "Monthly customer churn has increased from 3.5% to 4.9% over the past quarter, resulting in $2.3M ARR at risk. Support ticket volume has doubled, and NPS scores dropped from 42 to 28.",
    context_constraints: "Budget limited to $500K. Team bandwidth at 80% capacity. No additional headcount approved. Must maintain current product roadmap commitments.",
    desired_outcome: "Reduce churn rate to 3.0% within 90 days while improving NPS to 40+. Measurable KPI: monthly churn rate, support ticket resolution time, NPS score.",
    stakeholders: ["VP Customer Success", "Head of Product", "CFO", "Support Team Lead"],
    current_attempts: "Implemented exit surveys (20% response rate). Added account health scoring (not actionable yet). Increased support staff hours.",
    status: 'solution',
    priority_score: 9,
    impact_score: 8,
    symptoms: [
      "Support ticket volume doubled",
      "NPS dropped from 42 to 28",
      "Feature adoption rate declined 25%",
      "Average time-to-resolution increased 3x"
    ],
    root_causes: [
      { description: "Onboarding completion rate is only 45%, leaving users unprepared", type: "process", confidence: 85 },
      { description: "Key features buried in UI, adoption rate 30% lower than competitors", type: "technology", confidence: 78 },
      { description: "Support team lacks product training for complex queries", type: "people", confidence: 72 }
    ],
    assumptions: [
      "Users who complete onboarding have 60% lower churn",
      "Feature discovery improvements will increase engagement"
    ],
    constraints: [
      "Cannot change pricing structure",
      "Must maintain API compatibility",
      "Limited engineering resources for Q1"
    ],
    solutions: [
      {
        title: "Guided Onboarding Overhaul",
        description: "Redesign onboarding flow with interactive tutorials, milestone tracking, and personalized setup wizards. Add in-app guidance for key features.",
        effectiveness_score: 9,
        speed_score: 6,
        cost_score: 7,
        risk_score: 8,
        reversibility_score: 9,
        leverage_score: 8,
        total_score: 47,
        second_order_effects: ["Increased feature adoption", "Reduced support tickets", "Higher user engagement"],
        is_selected: true,
        eliminated: false
      },
      {
        title: "Proactive Customer Success Program",
        description: "Implement health score alerts with automated outreach. Assign dedicated CSMs to at-risk accounts based on usage patterns.",
        effectiveness_score: 8,
        speed_score: 7,
        cost_score: 5,
        risk_score: 7,
        reversibility_score: 8,
        leverage_score: 7,
        total_score: 42,
        is_selected: false,
        eliminated: false
      },
      {
        title: "Feature Redesign Sprint",
        description: "Reorganize product UI to surface high-value features. A/B test new navigation patterns.",
        effectiveness_score: 7,
        speed_score: 5,
        cost_score: 4,
        risk_score: 5,
        reversibility_score: 7,
        leverage_score: 6,
        total_score: 34,
        is_selected: false,
        eliminated: true,
        elimination_reason: "Relies on unverified assumption about UI being primary churn driver"
      }
    ]
  },
  {
    title: "Engineering Velocity Dropped 35%",
    problem_statement: "Sprint completion rate has fallen from 85% to 55%. Technical debt is accumulating faster than being resolved. Team morale surveys show 40% dissatisfaction with current processes.",
    context_constraints: "No additional headcount. Must maintain production stability. Critical Q2 launch commitments remain fixed.",
    desired_outcome: "Return sprint completion to 80%+ within 60 days. Reduce critical bugs in production by 50%. Improve team satisfaction to 70%+.",
    stakeholders: ["VP Engineering", "Product Manager", "Tech Lead", "Engineering Team"],
    current_attempts: "Added sprint retrospectives. Implemented code review guidelines. Tried pair programming.",
    status: 'intake',
    priority_score: 8,
    impact_score: 7,
    symptoms: [
      "Sprint completion rate dropped to 55%",
      "Production incidents increased 2x",
      "Code review turnaround time tripled",
      "Team members reporting burnout"
    ],
    root_causes: [
      { description: "Unclear requirements causing mid-sprint changes", type: "process", confidence: 82 },
      { description: "Legacy codebase complexity slowing development", type: "technology", confidence: 75 },
      { description: "Context switching between too many projects", type: "people", confidence: 70 }
    ],
    assumptions: [
      "Better requirements will reduce rework",
      "Dedicated focus time improves output"
    ],
    constraints: [
      "Cannot pause current projects",
      "Must maintain on-call rotations"
    ],
    solutions: []
  }
];

export const sampleTasks: Omit<Task, 'id' | 'solution_id' | 'created_at' | 'updated_at'>[] = [
  {
    title: "Design new onboarding wireframes",
    description: "Create interactive prototypes for the new onboarding flow covering all user personas",
    owner: "Design Team",
    status: "completed",
    deadline: "2026-01-20T00:00:00Z",
    kpi_target: 100,
    kpi_current: 100,
    kpi_threshold: 80,
    risk_level: "low",
    milestone: "Phase 1: Design",
    order_index: 0
  },
  {
    title: "Implement onboarding wizard component",
    description: "Build React components for multi-step wizard with progress tracking",
    owner: "Frontend Team",
    status: "in_progress",
    deadline: "2026-01-25T00:00:00Z",
    kpi_target: 100,
    kpi_current: 65,
    kpi_threshold: 70,
    risk_level: "medium",
    milestone: "Phase 2: Development",
    order_index: 1
  },
  {
    title: "Add analytics tracking to onboarding steps",
    description: "Implement event tracking for each onboarding step to measure completion rates",
    owner: "Analytics Team",
    status: "pending",
    deadline: "2026-01-28T00:00:00Z",
    kpi_target: 100,
    kpi_current: 0,
    kpi_threshold: 80,
    risk_level: "low",
    milestone: "Phase 2: Development",
    order_index: 2
  },
  {
    title: "User testing with beta group",
    description: "Conduct usability testing with 20 beta users, gather feedback",
    owner: "UX Research",
    status: "pending",
    deadline: "2026-02-01T00:00:00Z",
    dependencies: [],
    kpi_target: 20,
    kpi_current: 0,
    kpi_threshold: 15,
    risk_level: "medium",
    milestone: "Phase 3: Testing",
    order_index: 3
  },
  {
    title: "Production rollout (10% traffic)",
    description: "Gradual rollout to 10% of new signups with monitoring",
    owner: "DevOps Team",
    status: "pending",
    deadline: "2026-02-05T00:00:00Z",
    kpi_target: 10,
    kpi_current: 0,
    kpi_threshold: 5,
    risk_level: "high",
    milestone: "Phase 4: Rollout",
    order_index: 4
  }
];

export const sampleKPIs: Omit<KPI, 'id' | 'problem_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: "Monthly Churn Rate",
    target_value: 3.0,
    current_value: 4.2,
    threshold_value: 3.5,
    unit: "%"
  },
  {
    name: "NPS Score",
    target_value: 40,
    current_value: 32,
    threshold_value: 35,
    unit: "pts"
  },
  {
    name: "Onboarding Completion",
    target_value: 80,
    current_value: 58,
    threshold_value: 65,
    unit: "%"
  },
  {
    name: "Support Ticket Resolution",
    target_value: 4,
    current_value: 8.5,
    threshold_value: 6,
    unit: "hours"
  }
];
