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

  async run(userInput: string): Promise<string> {
    const xray = new XRay();
    xray.startExecution("Dynamic Product Search", { originalRequest: userInput });
    
    try {
      // 1. Generation Step
      const genStep = xray.startStep("Generate Search Keywords", "generation", { userInput });
      
      const genPrompt = `
        User Request: "${userInput}"
        Task: Extract key search terms for searching a product database.
        Output JSON: { "keywords": ["term1", "term2"], "reasoning": "explanation" }
      `;
      
      const genResult = await this.openai.generateJson<{ keywords: string[], reasoning: string }>(genPrompt);
      
      genStep.addArtifact("Prompt Analysis", { derivedKeywords: genResult.keywords });
      genStep.setReasoning(genResult.reasoning);
      genStep.setOutput({ keywords: genResult.keywords });
      xray.endStep(genStep);

      // 2. Search Step
      const searchStep = xray.startStep("Search Database", "search", { keywords: genResult.keywords });
      
      const searchResults = this.performSearch(genResult.keywords);
      
      searchStep.addArtifact("Raw Search Results", { count: searchResults.length });
      searchStep.setOutput({ results: searchResults });
      xray.endStep(searchStep);

      if (searchResults.length === 0) {
        xray.endExecution();
        return xray.getExecutionId() || "";
      }

      // 3. Filter Step
      const filterStep = xray.startStep("Apply Intelligent Filters", "apply_filter", { itemCount: searchResults.length });
      
      // Heuristic: Let AI decide filter criteria based on initial user input
      const filterPrompt = `
        User Request: "${userInput}"
        Items found: ${searchResults.length}
        Task: Define 1-2 strict filter criteria values if applicable (e.g., maxPrice, minRating, material).
        Output JSON: { "maxPrice": number | null, "minRating": number | null, "requiredMaterial": string | null, "reasoning": "..." }
      `;
      
      const filterCriteria = await this.openai.generateJson<{ maxPrice?: number, minRating?: number, requiredMaterial?: string, reasoning: string }>(filterPrompt);
      
      const filteredResults = searchResults.filter(p => {
        if (filterCriteria.maxPrice && p.price > filterCriteria.maxPrice) return false;
        if (filterCriteria.minRating && p.rating < filterCriteria.minRating) return false;
        if (filterCriteria.requiredMaterial && p.material !== filterCriteria.requiredMaterial) return false;
        return true;
      });

      const droppedCount = searchResults.length - filteredResults.length;
      const filterArtifactId = filterStep.addArtifact("Filter Logic", { criteria: filterCriteria, dropped: droppedCount });
      
      filterStep.evaluateArtifact(filterArtifactId, [
        { criterion: "Filter Applied", passed: true, detail: `Applied ${JSON.stringify(filterCriteria)}` }
      ]);
      
      filterStep.setReasoning(filterCriteria.reasoning);
      filterStep.setOutput({ filteredItems: filteredResults });
      xray.endStep(filterStep);

      if (filteredResults.length === 0) {
        xray.endExecution();
        return xray.getExecutionId() || "";
      }

      // 4. Relevance Step
      const evalStep = xray.startStep("Semantic Relevance Check", "llm_relevance_evaluation", { itemCount: filteredResults.length });
      
      // Batch evaluation for simplicity (or single item loop)
      const scoredItems = [];
      for (const item of filteredResults) {
        const evalPrompt = `
            User Request: "${userInput}"
            Product: ${item.title} (${item.category}) - ${item.description || ""}
            Task: Rate relevance from 0.0 to 1.0 and give 1 sentence reasoning.
            Output JSON: { "score": number, "reasoning": "string" }
        `;
        const evalRes = await this.openai.generateJson<{ score: number, reasoning: string }>(evalPrompt);
        scoredItems.push({ ...item, relevanceScore: evalRes.score, matchReasoning: evalRes.reasoning });
      }

      evalStep.addArtifact("Relevance Scores", scoredItems.map(s => ({ title: s.title, score: s.relevanceScore })));
      evalStep.setOutput({ scoredItems });
      xray.endStep(evalStep);

      // 5. Ranking Step
      const rankStep = xray.startStep("Final Ranking", "ranking", { strategy: "AI Relevance Score" });
      
      const rankedItems = [...scoredItems].sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      rankStep.addArtifact("Top Pick", rankedItems[0]);
      rankStep.setOutput({ rankedItems });
      xray.endStep(rankStep);

    } catch (e) {
      console.error("XRay Execution Failed", e);
    } finally {
      xray.endExecution();
    }
    
    return xray.getExecutionId() || "";
  }

  private performSearch(keywords: string[]): any[] {
    // Simple exhaustive keyword match
    return this.productsData.filter(p => {
      const text = (p.title + " " + p.category + " " + p.color + " " + p.material).toLowerCase();
      // Relaxed match: at least one keyword fully matches
      return keywords.some(k => text.includes(k.toLowerCase()));
    });
  }
}

export const xrayService = new XRayService();
