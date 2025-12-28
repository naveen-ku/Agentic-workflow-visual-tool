// backend/src/routes/executions.ts
import { Router } from "express"
import { executionStore } from "../store/executionStore"
import { xrayService } from "../services/XRayService"

const router = Router()

router.get("/", (req, res) => {
  res.json(executionStore.list())
})

router.get("/:id", (req, res) => {
  const execution = executionStore.get(req.params.id)
  if (!execution) {
    return res.status(404).json({ error: "Not found" })
  }
  res.json(execution)
})

router.post("/", async (req, res) => {
  const { userInput } = req.body;
  if (!userInput) {
    return res.status(400).json({ error: "userInput is required" });
  }
  
  // Start async execution (fire and forget for this simple demo, or await if fast enough)
  // For better UX during demo, we might want to await it so the UI sees the result immediately,
  // or return the ID and let UI poll.
  // Given the complexity, let's await it for simplicity unless it times out.
  try {
    const executionId = await xrayService.run(userInput);
    res.json({ executionId, status: "completed" });
  } catch (err: any) {
    console.error("Execution failed:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router

