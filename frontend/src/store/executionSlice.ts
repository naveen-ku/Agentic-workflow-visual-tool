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

export const loadExecutions = createAsyncThunk(
  "executions/load",
  fetchExecutions
);

export const loadExecutionById = createAsyncThunk(
  "executions/loadById",
  fetchExecutionById
);

export const startNewExecution = createAsyncThunk(
  "executions/startNew",
  async (userInput: string, { dispatch }) => {
    const { createExecution } = await import("../api/xrayApi");
    const result = await createExecution(userInput);
    dispatch(loadExecutions()); // Refresh list
    dispatch(loadExecutionById(result.executionId)); // Select new one
    return result;
  }
);

const executionSlice = createSlice({
  name: "executions",
  initialState,
  reducers: {
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
        // Update the item in the list as well if it exists
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
