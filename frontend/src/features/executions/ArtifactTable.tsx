import { UI_LABELS } from "../../constants/ui";
import type { Artifact, Evaluation } from "../../types/xray";
import { PromptAnalysisArtifact } from "./artifacts/PromptAnalysisArtifact";
import { RawSearchResultsArtifact } from "./artifacts/RawSearchResultsArtifact";
import { RankedResultsArtifact } from "./artifacts/RankedResultsArtifact";
import { CandidateEvaluationsArtifact } from "./artifacts/CandidateEvaluationsArtifact";
import { RelevanceScoresArtifact } from "./artifacts/RelevanceScoresArtifact";
import { DefaultArtifact } from "./artifacts/DefaultArtifact";

// Shared interface for artifact sub-components
export interface ArtifactRendererProps {
  artifact: Artifact;
}

interface Props {
  artifacts: Artifact[];
  evaluations: Evaluation[];
}

/**
 * Component responsible for rendering various artifact types.
 */
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
          if (a.label === UI_LABELS.PROMPT_ANALYSIS_LABEL) {
            return <PromptAnalysisArtifact key={a.artifactId} artifact={a} />;
          }

          if (a.label === "Raw Search Results") {
            return <RawSearchResultsArtifact key={a.artifactId} artifact={a} />;
          }

          if (a.label === UI_LABELS.RANKED_RESULTS_LABEL) {
            return <RankedResultsArtifact key={a.artifactId} artifact={a} />;
          }

          if (a.label === UI_LABELS.CANDIDATE_EVALUATIONS_LABEL) {
            return (
              <CandidateEvaluationsArtifact key={a.artifactId} artifact={a} />
            );
          }

          if (a.label === UI_LABELS.RELEVANCE_SCORES_LABEL) {
            return <RelevanceScoresArtifact key={a.artifactId} artifact={a} />;
          }

          return (
            <DefaultArtifact
              key={a.artifactId}
              artifact={a}
              evaluation={evalMap[a.artifactId]}
            />
          );
        })}
      </tbody>
    </table>
  );
}
