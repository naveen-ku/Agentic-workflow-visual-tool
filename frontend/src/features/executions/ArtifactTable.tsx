import type { Artifact, Evaluation } from "../../types/xray"

interface Props {
  artifacts: Artifact[]
  evaluations: Evaluation[]
}

export function ArtifactTable({
  artifacts,
  evaluations,
}: Props) {
  const evalMap = Object.fromEntries(
    evaluations.map(e => [e.artifactId, e])
  )

  return (
    <table className="w-full text-sm border">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">Artifact</th>
          <th className="p-2">Status</th>
          <th className="p-2 text-left">Details</th>
        </tr>
      </thead>

      <tbody>
        {artifacts.map(a => {
          const evalResult = evalMap[a.artifactId]
          const passed = evalResult?.qualified

          return (
            <tr key={a.artifactId} className="border-t">
              <td className="p-2 font-medium">
                {a.label}
              </td>
              <td
                className={`p-2 text-center font-semibold
                  ${
                    passed
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
              >
                {passed ? "PASS" : "FAIL"}
              </td>
              <td className="p-2">
                {evalResult?.criteriaResults.map(c => (
                  <div
                    key={c.criterion}
                    className="text-xs"
                  >
                    <span
                      className={
                        c.passed
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {c.passed ? "✓" : "✗"}
                    </span>{" "}
                    {c.detail}
                  </div>
                ))}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
