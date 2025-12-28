import type { ArtifactRendererProps } from "../ArtifactTable";

export function RankedResultsArtifact({ artifact }: ArtifactRendererProps) {
  const data = artifact.data as any;
  const items = data.items || [];

  return (
    <tr key={artifact.artifactId} className="border-t">
      <td className="p-2 font-medium" colSpan={3}>
        <div className="mb-2 font-semibold text-gray-700">{artifact.label}</div>
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
                  <td className="p-2 border font-medium">{item.title}</td>
                  <td className="p-2 border text-center">
                    {item.relevanceScore?.toFixed(2)}
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
