import { Artifact } from "./Artifact";
import { Evaluation } from "./Evaluation";

export type StepType = string;

export interface Step {
  stepId: string;
  name: string;
  type: StepType;
  input: any;
  output?: any;
  reasoning?: string;

  artifacts: Artifact[];
  evaluations: Evaluation[];

  startedAt: number;
  endedAt?: number;
}
