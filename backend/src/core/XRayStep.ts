// XRayStep.ts
import { Step, StepType } from "../models/Step";
import { Artifact } from "../models/Artifact";
import { Evaluation, CriterionResult } from "../models/Evaluation";
import { v4 as uuidv4 } from "uuid";

export class XRayStep {
  private step: Step;

  constructor(name: string, type: StepType, input: any) {
    this.step = {
      stepId: uuidv4(),
      name,
      type,
      input,
      artifacts: [],
      evaluations: [],
      startedAt: Date.now(),
    };
  }

  getStepName(): string {
    return this.step.name;
  }

  getStepType(): string {
    return this.step.type;
  }

  /**
   * Records an artifact (intermediate result) for this step.
   * @param label - Human-readable label for the artifact.
   * @param data - The content of the artifact.
   */
  addArtifact(label: string, data: any): string {
    const artifact: Artifact = {
      artifactId: uuidv4(),
      label,
      data,
    };
    this.step.artifacts.push(artifact);
    return artifact.artifactId;
  }

  /**
   * Records an evaluation result for a specific artifact.
   */
  evaluateArtifact(artifactId: string, criteriaResults: CriterionResult[]) {
    const qualified = criteriaResults.every((c) => c.passed);

    const evaluation: Evaluation = {
      artifactId,
      qualified,
      criteriaResults,
    };

    this.step.evaluations.push(evaluation);
  }

  setOutput(output: any) {
    this.step.output = output;
  }

  setReasoning(reasoning: string) {
    this.step.reasoning = reasoning;
  }

  /**
   * Finalizes the step by setting the end time.
   */
  end(): Step {
    this.step.endedAt = Date.now();
    return this.step;
  }
}
