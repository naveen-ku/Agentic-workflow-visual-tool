import { Execution } from "../models/Execution"

class ExecutionStore {
  private static instance: ExecutionStore
  private executions = new Map<string, Execution>()

  private constructor() {}

  public static getInstance(): ExecutionStore {
    if (!ExecutionStore.instance) {
      ExecutionStore.instance = new ExecutionStore()
    }
    return ExecutionStore.instance
  }

  save(execution: Execution): void {
    this.executions.set(execution.executionId, execution)
  }

  list(): Execution[] {
    return Array.from(this.executions.values())
  }

  get(id: string): Execution | undefined {
    return this.executions.get(id)
  }
}

export const executionStore = ExecutionStore.getInstance()
