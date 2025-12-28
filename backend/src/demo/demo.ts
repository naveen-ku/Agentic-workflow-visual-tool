import { XRay } from "../core/XRay";
import fs from "fs";
import path from "path";

async function runDemo() {
  const xray = new XRay();

  // 1. Start Execution
  xray.startExecution("Product Search Workflow - Hiking Gear", { user: "adv-hiker", env: "production" });
  console.log("Started Execution: Product Search Workflow - Hiking Gear\n");

  // 2. Generation Step
  const genStep = xray.startStep("Generate Search Keywords", "generation", {
    product_title: "Lightweight Hydration Bladder for Trekking",
    category: "Camping & Hiking"
  });
  
  const keywords = ["hiking hydration bladder", "trekking water reservoir", "lightweight hydration pack", "camping water storage"];
  
  genStep.addArtifact("Prompt Analysis", { 
    intent: "Find hydration gear optimized for weight and durability",
    attributes: ["lightweight", "capacity: 2L+", "material: TPU or similar"]
  });
  
  const genReasoning = "User emphasized 'Lightweight' and 'Trekking'. Extracted keywords focus on 'bladder' and 'reservoir' to match hiking gear terminology.";
  genStep.setReasoning(genReasoning);
  genStep.setOutput({
    keywords,
    model: "gpt-4-turbo"
  });
  xray.endStep(genStep);
  
  console.log(`[Step: Generation] completed.`);
  console.log(`  Reasoning: ${genReasoning}`);
  console.log(`  Output: Generated ${keywords.length} keywords: ${keywords.join(", ")}\n`);

  // 3. Search Step
  const searchStep = xray.startStep("Search Products", "search", {
    keywords,
    source: "products.json"
  });

  // Load products data
  const productsPath = path.join(__dirname, "../data/products.json");
  const productsData = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

  // Detailed search logic with logging
  console.log(`[Step: Search] searching across ${productsData.length} products...`);
  const searchResults: any[] = [];
  
  productsData.forEach((p: any) => {
    const text = (p.title + " " + p.category + " " + p.description).toLowerCase();
    const matches = keywords.some(k => {
        const terms = k.split(" ");
        return terms.every(t => text.includes(t.toLowerCase()));
    });
    
    if (matches) {
        searchResults.push(p);
        // console.log(`  [Match] Found: ${p.title} (Category: ${p.category})`);
    }
  });

  searchStep.addArtifact("Search Query Stats", { 
    totalProducts: productsData.length, 
    matchesFound: searchResults.length 
  });
  
  searchStep.setOutput({ resultsCount: searchResults.length, results: searchResults });
  xray.endStep(searchStep);
  console.log(`  Reasoning: Found ${searchResults.length} items matching keywords. Filtered out ${productsData.length - searchResults.length} irrelevant items.\n`);

  // 4. Apply Filter Step
  const filterStep = xray.startStep("Filter Candidates", "apply_filter", {
    itemsCount: searchResults.length,
    filters: {
        maxPrice: 30.00,
        minRating: 4.0,
        exclude: "Plastic" // Let's prefer TPU or high quality materials
    }
  });

  console.log(`[Step: Filter] Applying filters (Price <= $30, Rating >= 4.0)...`);
  
  const filteredResults: any[] = [];
  const rejectedItems: any[] = [];

  searchResults.forEach((p: any) => {
    const priceOk = p.price <= 30.00;
    const ratingOk = p.rating >= 4.0;
    
    if (priceOk && ratingOk) {
        filteredResults.push(p);
        console.log(`  [PASS] ${p.title}: Price $${p.price} <= $30, Rating ${p.rating} >= 4.0`);
    } else {
        let reason = "";
        if (!priceOk) reason += `Over Budget ($${p.price}); `;
        if (!ratingOk) reason += `Low Rating (${p.rating}); `;
        rejectedItems.push({ title: p.title, reason });
        console.log(`  [FAIL] ${p.title}: ${reason}`);
    }
  });

  const filterArtifactId = filterStep.addArtifact("Filter Report", { 
    passed: filteredResults.length,
    rejected: rejectedItems.length,
    rejectedDetails: rejectedItems
  });

  filterStep.evaluateArtifact(filterArtifactId, [
    { criterion: "Budget Validation", passed: filteredResults.every((r:any) => r.price <= 30), detail: "All items under $30" },
    { criterion: "Quality Validation", passed: filteredResults.every((r:any) => r.rating >= 4.0), detail: "All items rated 4.0+" }
  ]);

  filterStep.setOutput({ filteredItems: filteredResults });
  xray.endStep(filterStep);
  console.log(`  Reasoning: Retained ${filteredResults.length} items. Dropped ${rejectedItems.length} items due to constraints.\n`);

  // 5. LLM Relevance Evaluation Step
  const evalStep = xray.startStep("Evaluate Relevance", "llm_relevance_evaluation", {
    items: filteredResults.map((p:any) => p.title),
    criteria: "Must be a flexible bladder/reservoir type, NOT a rigid bottle."
  });

  console.log(`[Step: Relevance Eval] detailed check for 'Bladder' vs 'Bottle'...`);

  // Simulation of LLM evaluation
  const scoredItems = filteredResults.map((item: any) => {
    let score = 0.5;
    let reasoning = "";
    
    const titleLower = item.title.toLowerCase();
    const categoryLower = item.category.toLowerCase();
    
    const isBladder = titleLower.includes("bladder") || categoryLower.includes("bladder");
    const isBottle = categoryLower.includes("bottle") || titleLower.includes("bottle") || titleLower.includes("jug");

    if (isBladder) {
        score = 0.95;
        reasoning = "High relevance: Explicitly identifies as a hydration bladder.";
    } else if (isBottle) {
        score = 0.2;
        reasoning = "Low relevance: Item is a rigid bottle/jug, not a flexible bladder.";
    } else {
        score = 0.5;
        reasoning = "Medium relevance: Type unclear from title, possibly compatible.";
    }

    console.log(`  [Eval] ${item.title} -> Score: ${score}. Reason: ${reasoning}`);

    return { 
        ...item, 
        relevanceScore: score, 
        reasoning
    };
  });

  evalStep.addArtifact("Relevance Scores", scoredItems.map((s:any) => ({ 
      title: s.title, 
      score: s.relevanceScore, 
      reasoning: s.reasoning 
  })));
  
  evalStep.setReasoning("Strict penalty applied to rigid bottles. Preference for 'TrailTrek' and similar bladder systems.");
  evalStep.setOutput({ scoredItems });
  xray.endStep(evalStep);
  console.log(`  Reasoning: Scored ${scoredItems.length} items. Identified best fits for 'hiking bladder'.\n`);

  // 6. Ranking Step
  const rankStep = xray.startStep("Rank Products", "ranking", {
    itemsCount: scoredItems.length,
    strategy: "Relevance Score (desc), then Weight (asc)"
  });

  console.log(`[Step: Ranking] Sorting by Score (desc) -> Weight (asc)...`);

  const rankedItems = [...scoredItems].sort((a: any, b: any) => {
      // 1. Sort by Score
      if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
      }
      
      // 2. Sort by Weight (parsing "0.4 lb" -> 0.4)
      const weightA = parseFloat(a.weight) || 100;
      const weightB = parseFloat(b.weight) || 100;
      return weightA - weightB;
  });
  
  rankedItems.forEach((item: any, idx: number) => {
      console.log(`  #${idx + 1}: ${item.title} (Score: ${item.relevanceScore}, Weight: ${item.weight})`);
  });

  rankStep.addArtifact("Final Validation", { topItem: rankedItems[0]?.title, score: rankedItems[0]?.relevanceScore });
  rankStep.setOutput({ 
      topRecommendation: rankedItems[0], 
      allRanked: rankedItems 
  });
  xray.endStep(rankStep);
  console.log(`  Output: Top recommendation is ${rankedItems[0]?.title}.\n`);

  // 7. End Execution
  xray.endExecution();
  console.log("Demo Execution Finished.");
}

runDemo().catch(console.error);

