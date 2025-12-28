// src/api/executionApi.ts
import type { Execution } from "../types/xray";

const BASE_URL = "http://localhost:3000/api";

/**
 * Fetches all execution records from the backend.
 * @returns Array of executions.
 */
export async function fetchExecutions(): Promise<Execution[]> {
  console.info("[xrayApi] fetchExecutions() start...");
  const res = await fetch(`${BASE_URL}/executions`);
  const data = await res.json();
  console.info("[xrayApi] fetchExecutions() end...", { count: data.length });
  return data;
}

/**
 * Fetches a single execution by its ID, including full details.
 * @param id - The UUID of the execution.
 */
export async function fetchExecutionById(id: string): Promise<Execution> {
  console.info("[xrayApi] fetchExecutionById() start...", id);
  const res = await fetch(`${BASE_URL}/executions/${id}`);
  const data = await res.json();
  console.info("[xrayApi] fetchExecutionById() end...");
  return data;
}

/**
 * Creates a new execution with the user's input.
 * The backend returns immediately (Async) with the new Execution ID.
 * @param userInput - The prompt/query from the user.
 */
export async function createExecution(
  userInput: string
): Promise<{ executionId: string }> {
  console.info("[xrayApi] createExecution() start...", userInput);
  const res = await fetch(`${BASE_URL}/executions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userInput }),
  });
  if (!res.ok) {
    console.error("[xrayApi] createExecution() error", res.statusText);
    throw new Error("Failed to create execution");
  }
  const data = await res.json();
  console.info("[xrayApi] createExecution() end...", data);
  return data;
}
