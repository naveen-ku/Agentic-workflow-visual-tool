// src/store/executionSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { Execution } from "../types/xray";
import { fetchExecutions, fetchExecutionById } from "../api/xrayApi";

interface ExecutionState {
  executions: Execution[];
  selected?: Execution;
  loading: boolean;
}

const initialState: ExecutionState = {
  executions: [],
  loading: false,
};

/**
 * Fetches the list of all historical executions.
 */
export const loadExecutions = createAsyncThunk(
  "executions/load",
  fetchExecutions
);

/**
 * Fetches detailed data for a single execution by ID.
 * This includes all steps, artifacts, and evaluations.
 */
export const loadExecutionById = createAsyncThunk(
  "executions/loadById",
  fetchExecutionById
);

/**
 * Initiates a new AI workflow execution.
 * 1. Calls API to create execution (async).
 * 2. Refreshes the execution list.
 * 3. Selects the new execution.
 */
export const startNewExecution = createAsyncThunk(
  "executions/startNew",
  async (userInput: string, { dispatch }) => {
    const { createExecution } = await import("../api/xrayApi");
    const result = await createExecution(userInput);
    dispatch(loadExecutions());
    dispatch(loadExecutionById(result.executionId));
    return result;
  }
);

const executionSlice = createSlice({
  name: "executions",
  initialState,
  reducers: {
    /**
     * Merges a live update (from SSE) into the store.
     * Updates both the list item and the currently selected execution if matches.
     */
    updateExecution(state, action: { payload: Execution }) {
      const updated = action.payload;
      if (state.selected?.executionId === updated.executionId) {
        state.selected = updated;
      }
      const index = state.executions.findIndex(
        (e) => e.executionId === updated.executionId
      );
      if (index !== -1) {
        state.executions[index] = updated;
      } else {
        state.executions.unshift(updated);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadExecutions.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadExecutions.fulfilled, (state, action) => {
        state.executions = action.payload;
        state.loading = false;
      })
      .addCase(loadExecutionById.fulfilled, (state, action) => {
        state.selected = action.payload;
        const index = state.executions.findIndex(
          (e) => e.executionId === action.payload.executionId
        );
        if (index !== -1) {
          state.executions[index] = action.payload;
        }
      });
  },
});

export const { updateExecution } = executionSlice.actions;
export default executionSlice.reducer;
