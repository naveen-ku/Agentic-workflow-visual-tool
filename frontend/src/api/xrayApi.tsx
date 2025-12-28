// src/api/executionApi.ts
import type { Execution } from "../types/xray";

const BASE_URL = "http://localhost:3000/api";

export async function fetchExecutions(): Promise<Execution[]> {
  console.info("[xrayApi] fetchExecutions() start...");
  const res = await fetch(`${BASE_URL}/executions`);
  const data = await res.json();
  console.info("[xrayApi] fetchExecutions() end...", { count: data.length });
  return data;
}

export async function fetchExecutionById(id: string): Promise<Execution> {
  console.info("[xrayApi] fetchExecutionById() start...", id);
  const res = await fetch(`${BASE_URL}/executions/${id}`);
  const data = await res.json();
  console.info("[xrayApi] fetchExecutionById() end...");
  return data;
}

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
