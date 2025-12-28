import type { ArtifactRendererProps } from "../ArtifactTable";
import { HighlightText } from "../../../components/HighlightText";

export function RawSearchResultsArtifact({ artifact }: ArtifactRendererProps) {
  const data = artifact.data as any;
  const results = data.results || [];
  const keywords = data.keywords || [];

  if (!results.length) return null;

  return (
    <tr key={artifact.artifactId} className="border-t">
      <td className="p-2 font-medium" colSpan={3}>
        <div className="mb-2 font-semibold text-gray-700">
          {artifact.label} ({data.count} items)
        </div>
        <div className="max-h-60 overflow-y-auto border rounded bg-gray-50 p-2">
          <ul className="space-y-2">
            {results.map((item: any, idx: number) => (
              <li key={idx} className="text-xs bg-white p-2 rounded shadow-sm">
                <div className="font-medium text-gray-800">
                  <HighlightText text={item.title} keywords={keywords} />
                </div>
                <div className="text-gray-500 mt-1">
                  {item.category && (
                    <span className="mr-2">
                      Category:{" "}
                      <HighlightText text={item.category} keywords={keywords} />
                    </span>
                  )}
                  {item.brand && (
                    <span>
                      Brand:{" "}
                      <HighlightText text={item.brand} keywords={keywords} />
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
