// src/api/executionApi.ts
import type { Execution } from "../types/xray"

const BASE_URL = "http://localhost:3000/api"

export async function fetchExecutions(): Promise<Execution[]> {
  const res = await fetch(`${BASE_URL}/executions`)
  return res.json()
}

export async function fetchExecutionById(
  id: string
): Promise<Execution> {
  const res = await fetch(`${BASE_URL}/executions/${id}`)
  return res.json()
}
