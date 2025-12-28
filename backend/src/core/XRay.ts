// XRay.ts
import { Execution } from "../models/Execution"
import { StepType } from "../models/Step"
import { XRayStep } from "./XRayStep"
import { v4 as uuidv4 } from 'uuid';
import { executionStore } from "../store/executionStore";

export class XRay {
  private execution?: Execution

constructor(
    private readonly store = executionStore
  ) {}


  startExecution(name: string, metadata?: Record<string, any>) {
    this.execution = {
      executionId: uuidv4(),
      name,
      metadata,
      steps: [],
      startedAt: Date.now(),
    }
  }

  startStep(name: string, type: StepType, input: any): XRayStep {
    if (!this.execution) {
      throw new Error("No active execution")
    }
    return new XRayStep(name, type, input)
  }

  endStep(step: XRayStep) {
    if (!this.execution) {
      throw new Error("No active execution")
    }
    this.execution.steps.push(step.end())
  }

  endExecution() {
    if (!this.execution) return

    this.execution.endedAt = Date.now()
    this.store.save(this.execution)
    this.execution = undefined
  }
}
