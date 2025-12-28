export const PROMPTS = {
  GENERATION: (userInput: string) => `
        User Request: "${userInput}"
        Task: Extract key search terms for searching a product database.
        Output JSON: { "keywords": ["term1", "term2"], "reasoning": "explanation" }
      `,
  FILTER: (userInput: string, count: number) => `
        User Request: "${userInput}"
        Items found: ${count}
        Task: Define 1-2 strict filter criteria values if applicable (e.g., maxPrice, minRating, material).
        Output JSON: { "maxPrice": number | null, "minRating": number | null, "requiredMaterial": string | null, "reasoning": "..." }
      `,
  EVALUATION: (userInput: string, item: any) => `
            User Request: "${userInput}"
            Product: ${item.title} (${item.category}) - ${
    item.description || ""
  }
            Task: Rate relevance from 0.0 to 1.0 and give 1 sentence reasoning.
            Output JSON: { "score": number, "reasoning": "string" }
        `,
};

export const STEP_NAMES = {
  GENERATION: "Generate Search Keywords",
  SEARCH: "Search Database",
  FILTER: "Apply Intelligent Filters",
  RELEVANCE: "Semantic Relevance Check",
  RANKING: "Final Ranking",
  FAILURE: "Execution Failed",
};

export const ARTIFACT_LABELS = {
  PROMPT_ANALYSIS: "Prompt Analysis",
  RAW_SEARCH_RESULTS: "Raw Search Results",
  FILTER_LOGIC: "Filter Logic",
  FILTER_CHECK: "Filter Check",
  RELEVANCE_SCORES: "Relevance Scores",
  TOP_PICK: "Top Pick",
  ERROR_DETAILS: "Error Details",
};

export const CRITERIA = {
  DATABASE_HIT: "Database Hit",
  FILTER_APPLIED: "Filter Applied",
  DATA_AVAILABILITY: "Data Availability",
  EXECUTION_SUCCESS: "Execution Success",
};
