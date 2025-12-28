import type { ArtifactRendererProps } from "../ArtifactTable";

export function CandidateEvaluationsArtifact({
  artifact,
}: ArtifactRendererProps) {
  const data = artifact.data as any[];
  if (!data || data.length === 0) return null;

  // Dynamically extract rule keys from the first item
  const firstItem = data[0];
  const ruleKeys = firstItem.rules ? Object.keys(firstItem.rules) : [];

  return (
    <tr key={artifact.artifactId} className="border-t">
      <td className="p-2 font-medium" colSpan={3}>
        <div className="mb-2 font-semibold text-gray-700">{artifact.label}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left border">Candidate</th>
                {ruleKeys.map((key) => (
                  <th key={key} className="p-2 text-center border capitalize">
                    {key}
                  </th>
                ))}
                <th className="p-2 text-center border">Result</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item: any, idx: number) => (
                <tr key={idx} className="border-t">
                  <td className="p-2 border font-medium">{item.item}</td>
                  {ruleKeys.map((key) => {
                    const rule = item.rules[key];
                    // Try to find a matching value property in the item (e.g., item.price)
                    // If not found, just use the key logic or empty
                    const value = item[key] !== undefined ? item[key] : "-";

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
                      item.qualified ? "text-green-600" : "text-gray-400"
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
