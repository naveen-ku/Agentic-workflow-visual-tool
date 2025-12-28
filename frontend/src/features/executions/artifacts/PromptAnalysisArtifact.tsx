import { UI_LABELS } from "../../../constants/ui";
import type { ArtifactRendererProps } from "../ArtifactTable";

export function PromptAnalysisArtifact({ artifact }: ArtifactRendererProps) {
  const data = artifact.data as any;
  const keywords = data.derivedKeywords
    ? data.derivedKeywords.split(",").map((s: string) => s.trim())
    : [];

  return (
    <tr key={artifact.artifactId} className="border-t">
      <td className="p-2 font-medium">{artifact.label}</td>
      <td className="p-2 text-center text-gray-500">{UI_LABELS.STATUS_INFO}</td>
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
