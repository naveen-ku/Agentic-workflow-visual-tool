import { XRay } from "../core/XRay";
import { OpenAIService } from "./OpenAIService";
import fs from "fs";
import path from "path";

export class XRayService {
  private openai: OpenAIService;
  private productsData: any[];

  constructor() {
    this.openai = new OpenAIService();
    // Load products once
    const productsPath = path.join(__dirname, "../data/products.json");
    this.productsData = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
  }

  // Synchronous/Blocking run for simpler UI handling
  async run(userInput: string): Promise<string> {
    const xray = new XRay();
    xray.startExecution(userInput, {
      originalRequest: userInput,
    });

    // Save initial state
    xray.saveState();

    // Await full execution
    await this.processExecution(xray, userInput);

    return xray.getExecutionId() || "";
  }

  private async processExecution(xray: XRay, userInput: string) {
    try {
      // 1. Generation Step
      const genStep = xray.startStep("Generate Search Keywords", "generation", {
        userInput,
      });

      const genPrompt = `
        User Request: "${userInput}"
        Task: Extract key search terms for searching a product database.
        Output JSON: { "keywords": ["term1", "term2"], "reasoning": "explanation" }
      `;

      const genResult = await this.openai.generateJson<{
        keywords: string[];
        reasoning: string;
      }>(genPrompt);

      genStep.addArtifact("Prompt Analysis", {
        derivedKeywords: genResult.keywords.join(", "),
      });
      genStep.setReasoning(genResult.reasoning);
      genStep.setOutput({ keywords: genResult.keywords });
      xray.endStep(genStep);
      xray.saveState(); // Update store after step

      // 2. Search Step
      const searchStep = xray.startStep("Search Database", "search", {
        keywords: genResult.keywords,
      });

      const searchResults = this.performSearch(genResult.keywords);

      const searchArtifact = searchStep.addArtifact("Raw Search Results", {
        count: searchResults.length,
      });
      searchStep.evaluateArtifact(searchArtifact, [
        {
          criterion: "Database Hit",
          passed: searchResults.length > 0,
          detail: `Found ${searchResults.length} products matching keywords.`,
        },
      ]);

      searchStep.setOutput({ results: searchResults });
      searchStep.setReasoning(
        `Found ${
          searchResults.length
        } items matching keywords: ${genResult.keywords.join(", ")}`
      );
      xray.endStep(searchStep);
      xray.saveState();

      if (searchResults.length === 0) {
        xray.endExecution();
        return;
      }

      // 3. Filter Step
      const filterStep = xray.startStep(
        "Apply Intelligent Filters",
        "apply_filter",
        { itemCount: searchResults.length }
      );

      const filterPrompt = `
        User Request: "${userInput}"
        Items found: ${searchResults.length}
        Task: Define 1-2 strict filter criteria values if applicable (e.g., maxPrice, minRating, material).
        Output JSON: { "maxPrice": number | null, "minRating": number | null, "requiredMaterial": string | null, "reasoning": "..." }
      `;

      const filterCriteria = await this.openai.generateJson<{
        maxPrice?: number;
        minRating?: number;
        requiredMaterial?: string;
        reasoning: string;
      }>(filterPrompt);

      const filteredResults = searchResults.filter((p) => {
        if (filterCriteria.maxPrice && p.price > filterCriteria.maxPrice)
          return false;
        if (filterCriteria.minRating && p.rating < filterCriteria.minRating)
          return false;
        if (
          filterCriteria.requiredMaterial &&
          p.material !== filterCriteria.requiredMaterial
        )
          return false;
        return true;
      });

      const droppedCount = searchResults.length - filteredResults.length;
      const filterArtifactId = filterStep.addArtifact("Filter Logic", {
        criteria: JSON.stringify(filterCriteria),
        message:
          droppedCount > 0
            ? `Excluded ${droppedCount} items`
            : "No items excluded (criteria matched all)",
        dropped: droppedCount,
      });

      filterStep.evaluateArtifact(filterArtifactId, [
        {
          criterion: "Filter Applied",
          passed: true,
          detail:
            droppedCount > 0
              ? `Dropped ${droppedCount} items based on ${JSON.stringify(
                  filterCriteria
                )}`
              : "No items dropped. Search results matched criteria.",
        },
      ]);

      filterStep.setReasoning(filterCriteria.reasoning);
      let itemsForRelevance = filteredResults;
      if (filteredResults.length === 0) {
        // Fallback: If filter is too strict, use original search results to keep the demo fun
        itemsForRelevance = searchResults;
        const warningArtifact = filterStep.addArtifact("Filter Check", {
          warning:
            "Filter removed all items. Reverting to original search results to continue analysis.",
        });
        filterStep.evaluateArtifact(warningArtifact, [
          {
            criterion: "Data Availability",
            passed: false,
            detail:
              "Filter was too strict, 0 items remained. Fallback enabled.",
          },
        ]);
        filterStep.setReasoning(
          "Filter was too strict (0 items). Reverting to search results for demonstration purposes."
        );
        filterStep.setOutput({
          filteredItems: itemsForRelevance,
          note: "Fallback triggered",
        });
      } else {
        filterStep.setOutput({ filteredItems: filteredResults });
      }
      xray.endStep(filterStep);
      xray.saveState();

      // 4. Relevance Step
      const evalStep = xray.startStep(
        "Semantic Relevance Check",
        "llm_relevance_evaluation",
        { itemCount: itemsForRelevance.length }
      );

      const scoredItems = [];
      for (const item of itemsForRelevance) {
        const evalPrompt = `
            User Request: "${userInput}"
            Product: ${item.title} (${item.category}) - ${
          item.description || ""
        }
            Task: Rate relevance from 0.0 to 1.0 and give 1 sentence reasoning.
            Output JSON: { "score": number, "reasoning": "string" }
        `;
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
        "Relevance Scores",
        scoredItems.map((s) => ({ title: s.title, score: s.relevanceScore }))
      );
      evalStep.setOutput({ scoredItems });
      xray.endStep(evalStep);
      xray.saveState();

      // 5. Ranking Step
      const rankStep = xray.startStep("Final Ranking", "ranking", {
        strategy: "AI Relevance Score",
      });

      const rankedItems = [...scoredItems].sort(
        (a, b) => b.relevanceScore - a.relevanceScore
      );

      rankStep.addArtifact("Top Pick", rankedItems[0]);
      rankStep.setOutput({ rankedItems });
      xray.endStep(rankStep);
      xray.saveState();
    } catch (e: any) {
      console.error("XRay Execution Failed", e);
      // Create a failure step to show in UI
      const errorStep = xray.startStep("Execution Failed", "custom", {
        error: e.message,
      });
      errorStep.setReasoning("An internal error occurred during processing.");
      errorStep.evaluateArtifact("Error Details", [
        {
          criterion: "Execution Success",
          passed: false,
          detail: e.message || String(e),
        },
      ]);
      xray.endStep(errorStep);
      xray.saveState();
    } finally {
      xray.endExecution();
      xray.saveState();
    }
  }

  private performSearch(keywords: string[]): any[] {
    // Simple exhaustive keyword match
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
      // Relaxed match: at least one keyword fully matches
      return keywords.some((k) => text.includes(k.toLowerCase()));
    });
  }
}

export const xrayService = new XRayService();
