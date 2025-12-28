import { Execution } from "../models/Execution"

export class InMemoryStore {
  private executions: Map<string, Execution> = new Map()

  saveExecution(execution: Execution) {
    this.executions.set(execution.executionId, execution)
  }

  getExecution(id: string): Execution | undefined {
    return this.executions.get(id)
  }

  listExecutions(): Execution[] {
    return Array.from(this.executions.values())
  }
}
