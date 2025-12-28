import { XRay } from "../XRay"
import { InMemoryStore } from "../store/InMemoryStore"

const store = new InMemoryStore()
const xray = new XRay(store)

console.log("Starting X-Ray Demo Execution...\n")

xray.startExecution("competitor_selection_demo", {
  referenceProduct: "Stainless Steel Water Bottle 32oz",
})

// Step 1: Keyword Generation
const step1 = xray.startStep(
  "keyword_generation",
  "generation",
  { title: "Stainless Steel Water Bottle 32oz" }
)

step1.setOutput({
  keywords: ["stainless steel water bottle", "insulated water bottle 32oz"],
})

step1.setReasoning(
  "Extracted material, product type, and size from title"
)

xray.endStep(step1)

// Step 2: Candidate Filtering
const step2 = xray.startStep(
  "price_filter",
  "apply_filter",
  { priceRange: "$15 - $50" }
)

const hydro = step2.addArtifact("HydroFlask 32oz", {
  price: 44.99,
  rating: 4.5,
})

step2.evaluateArtifact(hydro, [
  {
    criterion: "price_range",
    passed: true,
    detail: "$44.99 is within range",
  },
])

const generic = step2.addArtifact("Generic Bottle", {
  price: 8.99,
  rating: 3.2,
})

step2.evaluateArtifact(generic, [
  {
    criterion: "price_range",
    passed: false,
    detail: "$8.99 is below minimum $15",
  },
])

step2.setOutput({
  passed: 1,
  failed: 1,
})

step2.setReasoning(
  "Applied price threshold to remove low-priced products"
)

xray.endStep(step2)

// Finish execution
xray.endExecution()

console.log("\nExecution complete.\n")
console.log(
  JSON.stringify(store.listExecutions(), null, 2)
)
