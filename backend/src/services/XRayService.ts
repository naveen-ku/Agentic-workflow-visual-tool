import { XRay } from "../core/XRay";
import { OpenAIService } from "./OpenAIService";
import fs from "fs";
import path from "path";
import { PROMPTS, STEP_NAMES, ARTIFACT_LABELS, CRITERIA } from "../constants";

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
      // ... inside processExecution ...

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
        {
          count: searchResults.length,
        }
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
      const filterStep = xray.startStep(STEP_NAMES.FILTER, "apply_filter", {
        itemCount: searchResults.length,
      });

      const filterPrompt = PROMPTS.FILTER(userInput, searchResults.length);

      const filterCriteria = await this.openai.generateJson<{
        maxPrice?: number;
        minRating?: number;
        requiredMaterial?: string;
        reasoning: string;
      }>(filterPrompt);

      const candidateEvaluations = searchResults.map((p) => {
        const rules = {
          price: {
            passed:
              !filterCriteria.maxPrice || p.price <= filterCriteria.maxPrice,
            detail: filterCriteria.maxPrice
              ? `${p.price} ${
                  p.price <= filterCriteria.maxPrice ? "<=" : ">"
                } ${filterCriteria.maxPrice}`
              : "N/A",
          },
          rating: {
            passed:
              !filterCriteria.minRating || p.rating >= filterCriteria.minRating,
            detail: filterCriteria.minRating
              ? `${p.rating} ${
                  p.rating >= filterCriteria.minRating ? ">=" : "<"
                } ${filterCriteria.minRating}`
              : "N/A",
          },
          material: {
            passed:
              !filterCriteria.requiredMaterial ||
              p.material === filterCriteria.requiredMaterial,
            detail: filterCriteria.requiredMaterial
              ? `${p.material} ${
                  p.material === filterCriteria.requiredMaterial ? "==" : "!="
                } ${filterCriteria.requiredMaterial}`
              : "N/A",
          },
        };

        const qualified = Object.values(rules).every((r) => r.passed);
        return {
          item: `${p.title} (${p.brand})`,
          price: p.price,
          rating: p.rating,
          material: p.material,
          rules,
          qualified,
          originalItem: p,
        };
      });

      const filteredResults = candidateEvaluations
        .filter((c) => c.qualified)
        .map((c) => c.originalItem);

      filterStep.addArtifact(
        ARTIFACT_LABELS.CANDIDATE_EVALUATIONS,
        candidateEvaluations
      );

      const droppedCount = searchResults.length - filteredResults.length;
      const filterArtifactId = filterStep.addArtifact(
        ARTIFACT_LABELS.FILTER_LOGIC,
        {
          criteria: JSON.stringify(filterCriteria),
          message:
            droppedCount > 0
              ? `Excluded ${droppedCount} items`
              : "No items excluded (criteria matched all)",
          dropped: droppedCount,
        }
      );

      filterStep.evaluateArtifact(filterArtifactId, [
        {
          criterion: CRITERIA.FILTER_APPLIED,
          passed: true,
          detail:
            droppedCount > 0
              ? `Dropped ${droppedCount} items based on detailed rules (see Candidate Evaluations).`
              : "No items dropped. Search results matched criteria.",
        },
      ]);

      filterStep.setReasoning(filterCriteria.reasoning);
      let itemsForRelevance = filteredResults;
      if (filteredResults.length === 0) {
        itemsForRelevance = searchResults;
        const warningArtifact = filterStep.addArtifact(
          ARTIFACT_LABELS.FILTER_CHECK,
          {
            warning:
              "Filter removed all items. Reverting to original search results to continue analysis.",
          }
        );
        filterStep.evaluateArtifact(warningArtifact, [
          {
            criterion: CRITERIA.DATA_AVAILABILITY,
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
        STEP_NAMES.RELEVANCE,
        "llm_relevance_evaluation",
        { itemCount: itemsForRelevance.length }
      );

      const scoredItems = [];
      for (const item of itemsForRelevance) {
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
    } catch (e: any) {
      console.error("XRay Execution Failed", e);
      const errorStep = xray.startStep(STEP_NAMES.FAILURE, "custom", {
        error: e.message,
      });
      errorStep.setReasoning("An internal error occurred during processing.");
      errorStep.evaluateArtifact(ARTIFACT_LABELS.ERROR_DETAILS, [
        {
          criterion: CRITERIA.EXECUTION_SUCCESS,
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
