// XRay.ts
import { Execution } from "./models/Execution"
import { StepType } from "./models/Step"
import { InMemoryStore } from "./store/InMemoryStore"
import { XRayStep } from "./core/XRayStep"
import { v4 as uuidv4 } from 'uuid';

export class XRay {
  private store: InMemoryStore
  private execution?: Execution

  constructor(store: InMemoryStore) {
    this.store = store
  }

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
    this.store.saveExecution(this.execution)
    this.execution = undefined
  }
}
