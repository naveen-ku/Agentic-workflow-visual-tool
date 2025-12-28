// XRay.ts
import { Execution } from "../models/Execution";
import { StepType } from "../models/Step";
import { XRayStep } from "./XRayStep";
import { v4 as uuidv4 } from "uuid";
import { executionStore } from "../store/executionStore";

export class XRay {
  private execution?: Execution;

  constructor(private readonly store = executionStore) {}

  startExecution(name: string, metadata?: Record<string, any>) {
    console.info("[XRay] startExecution() start... ", name);
    this.execution = {
      executionId: uuidv4(),
      name,
      metadata,
      steps: [],
      startedAt: Date.now(),
    };
    console.info("[XRay] startExecution() end... ");
  }

  startStep(name: string, type: StepType, input: any): XRayStep {
    console.info("[XRay] startStep() start... ", name, " , ", type);
    if (!this.execution) {
      throw new Error("No active execution");
    }
    console.info("[XRay] startStep() end... ");
    return new XRayStep(name, type, input);
  }

  endStep(step: XRayStep) {
    console.info(
      "[XRay] endStep() start... ",
      step.getStepName(),
      ", ",
      step.getStepType()
    );
    if (!this.execution) {
      throw new Error("No active execution");
    }
    this.execution.steps.push(step.end());
    console.info("[XRay] endStep() end... ");
  }

  endExecution() {
    console.info("[XRay] endExecution() start... ");
    if (!this.execution) return;

    this.execution.endedAt = Date.now();
    this.store.save(this.execution);
    this.execution = undefined;
    console.info("[XRay] endExecution() end... ");
  }

  getExecutionId(): string | undefined {
    return this.execution?.executionId;
  }

  saveState() {
    if (this.execution) {
      this.store.save(this.execution);
    }
  }
}
