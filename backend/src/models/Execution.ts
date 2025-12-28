import { Step } from "./Step";

export interface Execution {
  executionId: string;
  name: string;
  metadata?: Record<string, any>;

  steps: Step[];

  startedAt: number;
  endedAt?: number;
  status: "pending" | "running" | "completed" | "failed";
}
