// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import {
  loadExecutions,
  loadExecutionById,
  startNewExecution,
  updateExecution,
} from "../store/executionSlice";
import { ExecutionList } from "../features/executions/ExecutionList";
import { ExecutionDetail } from "../features/executions/ExecutionDetail";
import { useAppDispatch, useAppSelector } from "../hooks";
import { UI_LABELS } from "../constants/ui";

/**
 * Main dashboard component.
 * Displays the list of executions (sidebar) and the selected execution details.
 * Handles starting new executions and subscribing to live SSE updates.
 */
export function Dashboard() {
  const dispatch = useAppDispatch();
  const { executions, selected, loading } = useAppSelector(
    (state) => state.executions
  );
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(loadExecutions());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsSubmitting(true);
    try {
      console.log("[Dashboard] handleSubmit()", input);
      await dispatch(startNewExecution(input)).unwrap();
      setInput("");
    } catch (err) {
      console.error("Failed to start execution", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... inside Dashboard ...

  useEffect(() => {
    if (
      !selected ||
      (selected.status !== "pending" && selected.status !== "running")
    ) {
      return;
    }

    const eventSource = new EventSource(
      `http://localhost:3000/api/executions/${selected.executionId}/stream`
    );

    eventSource.onmessage = (event) => {
      try {
        const updatedExecution = JSON.parse(event.data);
        dispatch(updateExecution(updatedExecution));
      } catch (err) {
        console.error("Failed to parse SSE data", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [selected?.executionId, selected?.status, dispatch]);

  if (loading && executions.length === 0) {
    return <div className="p-4">{UI_LABELS.LOADING_MESSAGE}</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white border-b p-4 flex gap-4 items-center">
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            className="flex-1 border rounded px-3 py-2 text-sm"
            placeholder={UI_LABELS.INPUT_PLACEHOLDER}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? UI_LABELS.THINKING_BUTTON : UI_LABELS.START_BUTTON}
          </button>
        </form>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <ExecutionList
          executions={executions}
          selectedId={selected?.executionId}
          onSelect={(id) => dispatch(loadExecutionById(id))}
        />
        {selected ? (
          <ExecutionDetail key={selected.executionId} execution={selected} />
        ) : (
          <div className="flex-1 p-8 text-gray-400 flex items-center justify-center">
            {UI_LABELS.NO_EXECUTIONS_MESSAGE}
          </div>
        )}
      </div>
    </div>
  );
}
