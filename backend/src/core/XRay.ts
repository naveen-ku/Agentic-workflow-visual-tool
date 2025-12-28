// XRay.ts
import { Execution } from "../models/Execution";
import { StepType } from "../models/Step";
import { XRayStep } from "./XRayStep";
import { v4 as uuidv4 } from "uuid";
import { executionStore } from "../store/executionStore";

export class XRay {
  private execution?: Execution;

  constructor(private readonly store = executionStore) {}

  /**
   * Starts a new execution session with a unique ID.
   * @param name - Human-readable name for the execution (e.g. user input).
   * @param metadata - Optional metadata.
   */
  startExecution(name: string, metadata?: Record<string, any>) {
    console.info("[XRay] startExecution() start... ", name);
    this.execution = {
      executionId: uuidv4(),
      name,
      metadata,
      steps: [],
      startedAt: Date.now(),
      status: "pending",
    };
    console.info("[XRay] startExecution() end... ");
  }

  /**
   * Manually updates the execution status and persists state.
   */
  setStatus(status: "pending" | "running" | "completed" | "failed") {
    if (this.execution) {
      this.execution.status = status;
      this.saveState();
    }
  }

  /**
   * Starts a new logical step within the execution.
   * Automatically transitions status to 'running' if it was 'pending'.
   */
  startStep(name: string, type: StepType, input: any): XRayStep {
    console.info("[XRay] startStep() start... ", name, " , ", type);
    if (!this.execution) {
      throw new Error("No active execution");
    }
    if (this.execution.status === "pending") {
      this.execution.status = "running";
      this.saveState();
    }
    console.info("[XRay] startStep() end... ");
    return new XRayStep(name, type, input);
  }

  /**
   * Compltes a step and appends it to the execution history.
   */
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

  /**
   * Finalizes the execution, setting the end timestamp and status.
   */
  endExecution() {
    console.info("[XRay] endExecution() start... ");
    if (!this.execution) return;

    this.execution.endedAt = Date.now();
    if (this.execution.status !== "failed") {
      this.execution.status = "completed";
    }
    this.store.save(this.execution);
    this.execution = undefined;
    console.info("[XRay] endExecution() end... ");
  }

  /**
   * Marks the execution as failed.
   */
  failExecution(error: string) {
    if (this.execution) {
      this.execution.status = "failed";
      this.store.save(this.execution);
    }
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
