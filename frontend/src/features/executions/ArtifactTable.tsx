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
          // Special handling for detailed candidate evaluations
          if (a.label === UI_LABELS.CANDIDATE_EVALUATIONS_LABEL) {
            const data = a.data as any[];
            if (!data || data.length === 0) return null;

            // Dynamically extract rule keys from the first item
            const firstItem = data[0];
            const ruleKeys = firstItem.rules
              ? Object.keys(firstItem.rules)
              : [];

            return (
              <tr key={a.artifactId} className="border-t">
                <td className="p-2 font-medium" colSpan={3}>
                  <div className="mb-2 font-semibold text-gray-700">
                    {a.label}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border bg-white">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 text-left border">Candidate</th>
                          {ruleKeys.map((key) => (
                            <th
                              key={key}
                              className="p-2 text-center border capitalize"
                            >
                              {key}
                            </th>
                          ))}
                          <th className="p-2 text-center border">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2 border font-medium">
                              {item.item}
                            </td>
                            {ruleKeys.map((key) => {
                              const rule = item.rules[key];
                              // Try to find a matching value property in the item (e.g., item.price)
                              // If not found, just use the key logic or empty
                              const value =
                                item[key] !== undefined ? item[key] : "-";

                              return (
                                <td
                                  key={key}
                                  className={`p-2 border text-center ${
                                    rule.passed
                                      ? "text-green-600"
                                      : "text-red-600 bg-red-50"
                                  }`}
                                  title={rule.detail}
                                >
                                  {value}
                                  {!rule.passed && "*"}
                                </td>
                              );
                            })}
                            <td
                              className={`p-2 border text-center font-bold ${
                                item.qualified
                                  ? "text-green-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {item.qualified ? "QUALIFIED" : "REJECTED"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            );
          }

          if (a.label === UI_LABELS.RELEVANCE_SCORES_LABEL) {
            const data = a.data as any[];
            if (!data || data.length === 0) return null;

            return (
              <tr key={a.artifactId} className="border-t">
                <td className="p-2 font-medium" colSpan={3}>
                  <div className="mb-2 font-semibold text-gray-700">
                    {a.label}
                  </div>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-xs border bg-white">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 text-left border">ASIN</th>
                          <th className="p-2 text-left border">Title</th>
                          <th className="p-2 text-center border">Score</th>
                          <th className="p-2 text-left border">Reasoning</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2 border font-mono text-gray-500">
                              {item.asin || "-"}
                            </td>
                            <td className="p-2 border font-medium">
                              {item.title}
                            </td>
                            <td className="p-2 border text-center font-bold">
                              {item.score?.toFixed(2)}
                            </td>
                            <td className="p-2 border text-gray-600">
                              {item.reasoning}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            );
          }

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
