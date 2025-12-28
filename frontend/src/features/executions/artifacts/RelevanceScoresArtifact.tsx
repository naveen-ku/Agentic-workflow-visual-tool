import type { ArtifactRendererProps } from "../ArtifactTable";

export function RelevanceScoresArtifact({ artifact }: ArtifactRendererProps) {
  const data = artifact.data as any[];
  if (!data || data.length === 0) return null;

  return (
    <tr key={artifact.artifactId} className="border-t">
      <td className="p-2 font-medium" colSpan={3}>
        <div className="mb-2 font-semibold text-gray-700">{artifact.label}</div>
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
                  <td className="p-2 border font-medium">{item.title}</td>
                  <td className="p-2 border text-center font-bold">
                    {item.score?.toFixed(2)}
                  </td>
                  <td className="p-2 border text-gray-600">{item.reasoning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
}
