export interface Execution {
  executionId: string;
  name: string;
  metadata?: Record<string, any>;
  steps: Step[];
  startedAt: number;
  endedAt?: number;
  status?: "pending" | "running" | "completed" | "failed";
}

export interface Step {
  stepId: string;
  name: string;
  type: string;
  input: any;
  output?: any;
  reasoning?: string;
  artifacts: Artifact[];
  evaluations: Evaluation[];
}

export interface Artifact {
  artifactId: string;
  label: string;
  data: any;
}

export interface Evaluation {
  artifactId: string;
  qualified: boolean;
  criteriaResults: {
    criterion: string;
    passed: boolean;
    detail: string;
  }[];
}
