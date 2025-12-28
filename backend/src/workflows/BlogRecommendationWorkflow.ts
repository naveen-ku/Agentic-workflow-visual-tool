import { IWorkflow } from "./IWorkflow";
import { XRay } from "../core/XRay";
import { OpenAIService } from "../services/OpenAIService";
import { STEP_NAMES, ARTIFACT_LABELS, CRITERIA } from "../constants";
import path from "path";
import fs from "fs";

export class BlogRecommendationWorkflow implements IWorkflow {
  name = "Blog Recommendation Workflow";
  private openai: OpenAIService;
  private blogsData: any[];

  constructor() {
    this.openai = new OpenAIService();
    const blogsPath = path.join(__dirname, "../data/blogs.json");
    this.blogsData = JSON.parse(fs.readFileSync(blogsPath, "utf-8"));
  }

  async run(userInput: string, xray: XRay): Promise<void> {
    // 1. Generation
    const genStep = xray.startStep(STEP_NAMES.GENERATION, "generation", {
      userInput,
    });
    const genPrompt = `
      User Request: "${userInput}"
      Task: Extract key topics and target audience complexity (Beginner/Intermediate/Advanced) for a technical blog search.
      Output JSON: { "topics": ["topic1"], "complexity": "Beginner" | null, "reasoning": "..." }
    `;
    const genResult = await this.openai.generateJson<{
      topics: string[];
      complexity: string | null;
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

    // 3. Filter (Complexity & Age)
    const filterStep = xray.startStep(STEP_NAMES.FILTER, "apply_filter", {
      count: searchResults.length,
      targetComplexity: genResult.complexity,
    });

    const filteredResults = searchResults.filter((b) => {
      if (genResult.complexity && b.difficulty_level !== genResult.complexity)
        return false;
      return true;
    });

    filterStep.addArtifact(ARTIFACT_LABELS.FILTER_LOGIC, {
      complexityFilter: genResult.complexity || "None",
      dropped: searchResults.length - filteredResults.length,
    });

    // Blog Metric Artifact
    filterStep.addArtifact(
      ARTIFACT_LABELS.BLOG_METRICS,
      filteredResults.map((b) => ({
        title: b.title,
        views: b.metrics.views,
        sentiment: b.recommendation_data.sentiment,
      }))
    );

    filterStep.setOutput({ filteredResults });
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
  }
}
