import { UI_LABELS } from "../../../constants/ui";
import type { Artifact, Evaluation } from "../../../types/xray";

interface DefaultArtifactProps {
  artifact: Artifact;
  evaluation?: Evaluation;
}

export function DefaultArtifact({
  artifact,
  evaluation,
}: DefaultArtifactProps) {
  const hasEvaluation = !!evaluation;
  const passed = evaluation?.qualified;

  return (
    <tr key={artifact.artifactId} className="border-t">
      <td className="p-2 font-medium">{artifact.label}</td>
      <td
        className={`p-2 text-center font-semibold ${
          hasEvaluation
            ? passed
              ? "text-green-600"
              : "text-red-600"
            : "text-gray-500"
        }`}
      >
        {hasEvaluation
          ? passed
            ? UI_LABELS.STATUS_PASS
            : UI_LABELS.STATUS_FAIL
          : UI_LABELS.STATUS_INFO}
      </td>
      <td className="p-2">
        {/* Show evaluation details if present */}
        {evaluation?.criteriaResults.map((c) => (
          <div key={c.criterion} className="text-xs">
            <span className={c.passed ? "text-green-600" : "text-red-600"}>
              {c.passed ? "✓" : "✗"}
            </span>{" "}
            {c.detail}
          </div>
        ))}
        {/* Fallback: Show raw data if no evaluation details or to supplement */}
        {!evaluation && (
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
            {JSON.stringify(artifact.data, null, 2)}
          </pre>
        )}
      </td>
    </tr>
  );
}
