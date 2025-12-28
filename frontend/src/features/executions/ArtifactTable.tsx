import { UI_LABELS } from "../../constants/ui";
import type { Artifact, Evaluation } from "../../types/xray";

interface Props {
  artifacts: Artifact[];
  evaluations: Evaluation[];
}

export function ArtifactTable({ artifacts, evaluations }: Props) {
  const evalMap = Object.fromEntries(evaluations.map((e) => [e.artifactId, e]));

  return (
    <table className="w-full text-sm border">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">{UI_LABELS.TABLE_HEADER_ARTIFACT}</th>
          <th className="p-2">{UI_LABELS.TABLE_HEADER_STATUS}</th>
          <th className="p-2 text-left">{UI_LABELS.TABLE_HEADER_DETAILS}</th>
        </tr>
      </thead>

      <tbody>
        {artifacts.map((a) => {
          const evalResult = evalMap[a.artifactId];
          const hasEvaluation = !!evalResult;
          const passed = evalResult?.qualified;

          return (
            <tr key={a.artifactId} className="border-t">
              <td className="p-2 font-medium">{a.label}</td>
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
                {evalResult?.criteriaResults.map((c) => (
                  <div key={c.criterion} className="text-xs">
                    <span
                      className={c.passed ? "text-green-600" : "text-red-600"}
                    >
                      {c.passed ? "✓" : "✗"}
                    </span>{" "}
                    {c.detail}
                  </div>
                ))}
                {/* Fallback: Show raw data if no evaluation details or to supplement */}
                {!evalResult && (
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(a.data, null, 2)}
                  </pre>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
