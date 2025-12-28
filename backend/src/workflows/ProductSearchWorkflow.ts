import { IWorkflow } from "./IWorkflow";
import { XRay } from "../core/XRay";
import { OpenAIService } from "../services/OpenAIService";
import { PROMPTS, STEP_NAMES, ARTIFACT_LABELS, CRITERIA } from "../constants";
import { DynamicFilterService } from "../services/DynamicFilterService";
import path from "path";
import fs from "fs";

export class ProductSearchWorkflow implements IWorkflow {
  name = "Product Search Workflow";
  private openai: OpenAIService;
  private filterService: DynamicFilterService;
  private productsData: any[];

  constructor() {
    this.openai = OpenAIService.getInstance();
    this.filterService = new DynamicFilterService();
    const productsPath = path.join(__dirname, "../data/products.json");
    this.productsData = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
  }

  async run(userInput: string, xray: XRay): Promise<void> {
    console.info("[ProductSearchWorkflow] run() start...", userInput);
    // 1. Generation Step
    const genStep = xray.startStep(STEP_NAMES.GENERATION, "generation", {
      userInput,
    });
    const genPrompt = PROMPTS.GENERATION(userInput);
    const genResult = await this.openai.generateJson<{
      keywords: string[];
      reasoning: string;
    }>(genPrompt);

    genStep.addArtifact(ARTIFACT_LABELS.PROMPT_ANALYSIS, {
      derivedKeywords: genResult.keywords.join(", "),
    });
    genStep.setReasoning(genResult.reasoning);
    genStep.setOutput({ keywords: genResult.keywords });
    xray.endStep(genStep);
    xray.saveState();

    // 2. Search Step
    const searchStep = xray.startStep(STEP_NAMES.SEARCH, "search", {
      keywords: genResult.keywords,
    });
    const searchResults = this.performSearch(genResult.keywords);

    const searchArtifact = searchStep.addArtifact(
      ARTIFACT_LABELS.RAW_SEARCH_RESULTS,
      { count: searchResults.length }
    );
    searchStep.evaluateArtifact(searchArtifact, [
      {
        criterion: CRITERIA.DATABASE_HIT,
        passed: searchResults.length > 0,
        detail: `Found ${searchResults.length} products matching keywords.`,
      },
    ]);
    searchStep.setOutput({ results: searchResults });
    searchStep.setReasoning(
      `Found ${searchResults.length} items matching keywords.`
    );
    xray.endStep(searchStep);
    xray.saveState();

    if (searchResults.length === 0) {
      return;
    }

    // 3. Filter Step (Dynamic)
    const filterStep = xray.startStep(STEP_NAMES.FILTER, "apply_filter", {
      itemCount: searchResults.length,
    });

    // Use Schema-Agnostic Filter Service
    const filteredResults = await this.filterService.applyFilter(
      filterStep,
      searchResults,
      userInput
    );

    filterStep.setOutput({ filteredItems: filteredResults });
    xray.endStep(filterStep);
    xray.saveState();

    if (filteredResults.length === 0) {
      // STOP EXECUTION - Honest Debugging
      // Do not proceed with fallback
      return;
    }

    // 4. Relevance Step
    const evalStep = xray.startStep(
      STEP_NAMES.RELEVANCE,
      "llm_relevance_evaluation",
      { itemCount: filteredResults.length }
    );
    const scoredItems = [];
    for (const item of filteredResults) {
      const evalPrompt = PROMPTS.EVALUATION(userInput, item);
      const evalRes = await this.openai.generateJson<{
        score: number;
        reasoning: string;
      }>(evalPrompt);
      scoredItems.push({
        ...item,
        relevanceScore: evalRes.score,
        matchReasoning: evalRes.reasoning,
      });
    }
    evalStep.addArtifact(
      ARTIFACT_LABELS.RELEVANCE_SCORES,
      scoredItems.map((s) => ({ title: s.title, score: s.relevanceScore }))
    );
    evalStep.setOutput({ scoredItems });
    xray.endStep(evalStep);
    xray.saveState();

    // 5. Ranking Step
    const rankStep = xray.startStep(STEP_NAMES.RANKING, "ranking", {
      strategy: "AI Relevance Score",
    });
    const rankedItems = [...scoredItems].sort(
      (a, b) => b.relevanceScore - a.relevanceScore
    );
    rankStep.addArtifact(ARTIFACT_LABELS.TOP_PICK, rankedItems[0]);
    rankStep.setOutput({ rankedItems });
    xray.endStep(rankStep);
    xray.saveState();
    console.info("[ProductSearchWorkflow] run() end...");
  }

  private performSearch(keywords: string[]): any[] {
    console.info("[ProductSearchWorkflow] performSearch() start...", keywords);
    return this.productsData.filter((p) => {
      const text = (
        p.title +
        " " +
        p.category +
        " " +
        p.color +
        " " +
        p.material
      ).toLowerCase();
      return keywords.some((k) => text.includes(k.toLowerCase()));
    });
  }
}
