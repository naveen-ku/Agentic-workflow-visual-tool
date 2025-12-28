import { IWorkflow } from "./IWorkflow";
import { XRay } from "../core/XRay";
import { OpenAIService } from "../services/OpenAIService";
import { STEP_NAMES, ARTIFACT_LABELS, CRITERIA } from "../constants";
import { DynamicFilterService } from "../services/DynamicFilterService";
import path from "path";
import fs from "fs";

export class BlogRecommendationWorkflow implements IWorkflow {
  name = "Blog Recommendation Workflow";
  private openai: OpenAIService;
  private filterService: DynamicFilterService;
  private blogsData: any[];

  constructor() {
    this.openai = OpenAIService.getInstance();
    this.filterService = new DynamicFilterService();
    const blogsPath = path.join(__dirname, "../data/blogs.json");
    this.blogsData = JSON.parse(fs.readFileSync(blogsPath, "utf-8"));
  }

  async run(userInput: string, xray: XRay): Promise<void> {
    console.info("[BlogRecommendationWorkflow] run() start...", userInput);
    // 1. Generation
    const genStep = xray.startStep(STEP_NAMES.GENERATION, "generation", {
      userInput,
    });
    const genPrompt = `
      User Request: "${userInput}"
      Task: Extract key topics for blog recommendation and comparision.
      Output JSON: { "topics": ["topic1"], "reasoning": "..." }
    `;
    const genResult = await this.openai.generateJson<{
      topics: string[];
      reasoning: string;
    }>(genPrompt);

    genStep.addArtifact(ARTIFACT_LABELS.PROMPT_ANALYSIS, genResult);
    genStep.setReasoning(genResult.reasoning);
    xray.endStep(genStep);
    xray.saveState();

    // 2. Search (Tag Matching)
    const searchStep = xray.startStep(STEP_NAMES.SEARCH, "search", {
      topics: genResult.topics,
    });
    const searchResults = this.blogsData.filter((b) => {
      const text = (
        b.title +
        " " +
        b.category +
        " " +
        b.tags.join(" ")
      ).toLowerCase();
      return genResult.topics.some((t) => text.includes(t.toLowerCase()));
    });

    searchStep.addArtifact(ARTIFACT_LABELS.RAW_SEARCH_RESULTS, {
      count: searchResults.length,
    });
    searchStep.setOutput({ results: searchResults });
    xray.endStep(searchStep);
    xray.saveState();

    if (searchResults.length === 0) return;

    // 3. Filter (Dynamic)
    const filterStep = xray.startStep(STEP_NAMES.FILTER, "apply_filter", {
      count: searchResults.length,
    });

    // Use Schema-Agnostic Filter Service
    const filteredResults = await this.filterService.applyFilter(
      filterStep,
      searchResults,
      userInput
    );

    xray.endStep(filterStep);
    xray.saveState();

    if (filteredResults.length === 0) return;

    // 4. Ranking (Sentiment & Views)
    const rankStep = xray.startStep(STEP_NAMES.RANKING, "ranking", {
      strategy: "Sentiment * Views",
    });
    const ranked = filteredResults.sort((a, b) => {
      const scoreA = a.metrics.views * a.recommendation_data.sentiment;
      const scoreB = b.metrics.views * b.recommendation_data.sentiment;
      return scoreB - scoreA;
    });

    rankStep.addArtifact(ARTIFACT_LABELS.TOP_PICK, ranked[0]);
    rankStep.setOutput({ ranked });
    xray.endStep(rankStep);
    xray.saveState();
    console.info("[BlogRecommendationWorkflow] run() end...");
  }
}
