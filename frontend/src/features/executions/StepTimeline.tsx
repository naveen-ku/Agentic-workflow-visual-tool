import type { Step } from "../../types/xray";

interface Props {
  steps: Step[];
  selectedStepId?: string;
  onSelect: (id: string) => void;
}

/**
 * Left-hand list of steps in the execution.
 * Allows navigation between different steps of the workflow.
 */
export function StepTimeline({ steps, selectedStepId, onSelect }: Props) {
  return (
    <div className="w-64 border-r bg-white overflow-y-auto">
      {steps.map((step, idx) => (
        <div
          key={step.stepId}
          onClick={() => onSelect(step.stepId)}
          className={`px-4 py-3 cursor-pointer border-b
            ${
              step.stepId === selectedStepId
                ? "bg-blue-50 border-l-4 border-blue-500"
                : "hover:bg-gray-50"
            }`}
        >
          <div className="text-xs text-gray-500">Step {idx + 1}</div>
          <div className="font-medium text-sm">{step.name}</div>
          <div className="text-xs text-gray-400">{step.type}</div>
        </div>
      ))}
    </div>
  );
}
