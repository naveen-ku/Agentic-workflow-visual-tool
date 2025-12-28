import type { Step } from "../../types/xray";
import { ArtifactTable } from "./ArtifactTable";
import { UI_LABELS } from "../../constants/ui";

// ...

export function StepDetail({ step }: { step: Step }) {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">{step.name}</h2>

      <Section title={UI_LABELS.SECTION_INPUT}>
        <pre className="text-xs bg-gray-100 p-3 rounded">
          {JSON.stringify(step.input, null, 2)}
        </pre>
      </Section>

      {step.artifacts.length > 0 && (
        <Section title={UI_LABELS.SECTION_ARTIFACTS}>
          <ArtifactTable
            artifacts={step.artifacts}
            evaluations={step.evaluations}
          />
        </Section>
      )}

      {step.output && (
        <Section title={UI_LABELS.SECTION_OUTPUT}>
          <pre className="text-xs bg-gray-100 p-3 rounded">
            {JSON.stringify(step.output, null, 2)}
          </pre>
        </Section>
      )}

      {step.reasoning && (
        <Section title={UI_LABELS.SECTION_REASONING}>
          <p className="text-sm text-gray-700">{step.reasoning}</p>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="font-medium mb-2 text-gray-700">{title}</h3>
      {children}
    </div>
  );
}
