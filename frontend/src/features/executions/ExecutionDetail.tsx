import { StepTimeline } from "./StepTimeline";
import { StepDetail } from "./StepDetail";
import { useState } from "react";
import type { Execution } from "../../types/xray";

export function ExecutionDetail({ execution }: { execution: Execution }) {
  const steps = execution.steps || [];
  const [selectedStepId, setSelectedStepId] = useState(steps[0]?.stepId);

  // Update selection if execution changes (or steps load in)
  // This is needed if we start with 0 steps and then they appear
  if (selectedStepId === undefined && steps.length > 0) {
    setSelectedStepId(steps[0].stepId);
  }

  const selectedStep = steps.find((s) => s.stepId === selectedStepId);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="border-b p-4">
        <h1 className="text-lg font-semibold">{execution.name}</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <StepTimeline
          steps={steps}
          selectedStepId={selectedStepId}
          onSelect={setSelectedStepId}
        />

        {selectedStep && <StepDetail step={selectedStep} />}
      </div>
    </div>
  );
}
