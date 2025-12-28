export const PROMPTS = {
  GENERATION: (input: string) =>
    `User Request: "${input}"\nTask: Extract key search terms (keywords) and provide a reasoning for why they are relevant.\nOutput JSON: { "keywords": ["term1", "term2"], "reasoning": "..." }`,
  ROUTER: (input: string) =>
    `User Request: "${input}"
    Task: Classify the user's intent into one of the following workflows:
    - PRODUCT_SEARCH: For finding physical products, items, specs, or shopping-related queries.
    - BLOG_RECOMMENDATION: For finding articles, reading material, tutorials, opinion pieces, or educational content.
    
    Output JSON: { "workflow": "PRODUCT_SEARCH" | "BLOG_RECOMMENDATION", "reasoning": "..." }`,
  FILTER: (input: string, count: number) => `
        User Request: "${input}"
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
  BLOG_RECOMMENDATION: "Blog Recommendation Logic",
};

export const ARTIFACT_LABELS = {
  PROMPT_ANALYSIS: "Prompt Analysis",
  RAW_SEARCH_RESULTS: "Raw Search Results",
  FILTER_LOGIC: "Filter Logic",
  FILTER_CHECK: "Filter Check",
  RELEVANCE_SCORES: "Relevance Scores",
  TOP_PICK: "Top Pick",
  ERROR_DETAILS: "Error Details",
  CANDIDATE_EVALUATIONS: "Candidate Evaluations",
  BLOG_METRICS: "Blog Metrics",
};

export const CRITERIA = {
  DATABASE_HIT: "Database Hit",
  FILTER_APPLIED: "Filter Applied",
  DATA_AVAILABILITY: "Data Availability",
  EXECUTION_SUCCESS: "Execution Success",
};
