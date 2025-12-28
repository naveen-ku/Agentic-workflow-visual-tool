import { UI_LABELS } from "../../constants/ui";
import type { Artifact, Evaluation } from "../../types/xray";

interface Props {
  artifacts: Artifact[];
  evaluations: Evaluation[];
}

/**
 * Component responsible for rendering various artifact types.
 * Supports:
 * - Prompt Analysis (Chips)
 * - Raw Search Results (Highlighted List)
 * - Candidate Evaluations (Table)
 * - Relevance Scores (Table)
 * - Ranked Results (Table)
 * - General/Fallback JSON view
 */
export function ArtifactTable({ artifacts, evaluations }: Props) {
  const evalMap = Object.fromEntries(evaluations.map((e) => [e.artifactId, e]));

  /**
   * Helper component to highlight matched keywords within a text string.
   */
  const HighlightText = ({
    text,
    keywords,
  }: {
    text: string;
    keywords?: string[];
  }) => {
    if (!text) return null;
    if (!keywords || keywords.length === 0) return <>{text}</>;

    // Escape keywords for regex safety
    const safeKeywords = keywords.map((k) =>
      k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    const parts = text.split(new RegExp(`(${safeKeywords.join("|")})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          safeKeywords.some((k) => k.toLowerCase() === part.toLowerCase()) ? (
            <span
              key={i}
              className="bg-yellow-200 text-black font-semibold rounded px-0.5"
            >
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

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
          // 1. Prompt Analysis (Keywords)
          if (a.label === UI_LABELS.PROMPT_ANALYSIS_LABEL) {
            const data = a.data as any;
            const keywords = data.derivedKeywords
              ? data.derivedKeywords.split(",").map((s: string) => s.trim())
              : [];
            return (
              <tr key={a.artifactId} className="border-t">
                <td className="p-2 font-medium">{a.label}</td>
                <td className="p-2 text-center text-gray-500">
                  {UI_LABELS.STATUS_INFO}
                </td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((k: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                  {data.reasoning && (
                    <div className="mt-2 text-gray-600 text-xs italic">
                      {data.reasoning}
                    </div>
                  )}
                </td>
              </tr>
            );
          }

          // 2. Raw Search Results (Highlighting)
          if (a.label === "Raw Search Results") {
            // Hardcoded label fallback or use constant if avail
            const data = a.data as any;
            const results = data.results || [];
            const keywords = data.keywords || [];

            if (!results.length) return null;

            return (
              <tr key={a.artifactId} className="border-t">
                <td className="p-2 font-medium" colSpan={3}>
                  <div className="mb-2 font-semibold text-gray-700">
                    {a.label} ({data.count} items)
                  </div>
                  <div className="max-h-60 overflow-y-auto border rounded bg-gray-50 p-2">
                    <ul className="space-y-2">
                      {results.map((item: any, idx: number) => (
                        <li
                          key={idx}
                          className="text-xs bg-white p-2 rounded shadow-sm"
                        >
                          <div className="font-medium text-gray-800">
                            <HighlightText
                              text={item.title}
                              keywords={keywords}
                            />
                          </div>
                          <div className="text-gray-500 mt-1">
                            {item.category && (
                              <span className="mr-2">
                                Category:{" "}
                                <HighlightText
                                  text={item.category}
                                  keywords={keywords}
                                />
                              </span>
                            )}
                            {item.brand && (
                              <span>
                                Brand:{" "}
                                <HighlightText
                                  text={item.brand}
                                  keywords={keywords}
                                />
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </td>
              </tr>
            );
          }

          // 3. Ranked Results Table
          if (a.label === UI_LABELS.RANKED_RESULTS_LABEL) {
            const data = a.data as any;
            const items = data.items || [];

            return (
              <tr key={a.artifactId} className="border-t">
                <td className="p-2 font-medium" colSpan={3}>
                  <div className="mb-2 font-semibold text-gray-700">
                    {a.label}
                  </div>
                  <div className="overflow-x-auto mb-2">
                    <table className="w-full text-xs border bg-white">
                      <thead className="bg-green-50">
                        <tr>
                          <th className="p-2 text-center border">Rank</th>
                          <th className="p-2 text-left border">Title</th>
                          <th className="p-2 text-center border">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2 border text-center font-bold text-green-700">
                              #{item.rank}
                            </td>
                            <td className="p-2 border font-medium">
                              {item.title}
                            </td>
                            <td className="p-2 border text-center">
                              {item.relevanceScore?.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  x
                </td>
              </tr>
            );
          }
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
