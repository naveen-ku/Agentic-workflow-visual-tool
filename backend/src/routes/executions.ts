// backend/src/routes/executions.ts
import { Router } from "express";
import { executionStore } from "../store/executionStore";
import { xrayService } from "../services/XRayService";

const router = Router();

router.get("/", (req, res) => {
  res.json(executionStore.list());
});

router.get("/:id", (req, res) => {
  const execution = executionStore.get(req.params.id);
  if (!execution) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json(execution);
});

router.post("/", async (req, res) => {
  const { userInput } = req.body;
  if (!userInput) {
    return res.status(400).json({ error: "userInput is required" });
  }

  try {
    console.info("[execution] userInput... ", userInput);
    // Start execution asynchronously (do not await)
    // We assume run() returns the ID synchronously if we check how XRayService works,
    // BUT XRayService.run() is async and returns ID at the end currently.
    // WAIT: XRayService.run() returns Promise<string> (the ID).
    // If we want to return ID immediately, we need to change XRayService.run to return ID *before* awaiting the workflow.
    // OR we await the START of the execution to get the ID, but not the COMPLETION.

    // Let's modify the route to await the ID, but let the workflow run in background.
    // However, XRayService.run() currently awaits the whole thing.
    // I need to modify XRayService.run() first or wrap it here.

    // Actually, looking at XRayService.ts, it creates XRay instance, saves state (which gets an ID), then runs steps.
    // I should refactor XRayService to return ID immediately.

    // For now, I will modify `XRayService.run` to NOT be fully awaited in the service itself,
    // OR I will simply call it without awaiting response if I can get ID differently.

    // Better approach: Update XRayService.ts to split `initialize` and `start`.

    // Assuming I will update XRayService next.
    // Let's write the route assuming `xrayService.startExecution(userInput)` returns { id, promise }.

    // Current XRayService.run returns `Promise<string>`.

    // I will stick to modifying the route to use a new method `startInBackground` that I will add to Service.
    // Or I'll just change `run` behavior in the next step.

    // Let's update `executions.ts` to use `startExecution` which triggers the process.
    const executionId = await xrayService.startExecution(userInput);
    res.status(202).json({ executionId, status: "pending" });
  } catch (err: any) {
    console.error("Failed to start execution:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/stream", (req, res) => {
  const { id } = req.params;
  const execution = executionStore.get(id);

  if (!execution) {
    return res.status(404).json({ error: "Not found" });
  }

  // SSE Headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Initial data
  res.write(`data: ${JSON.stringify(execution)}\n\n`);

  // Listener
  const onUpdate = (updatedExec: any) => {
    res.write(`data: ${JSON.stringify(updatedExec)}\n\n`);
    if (updatedExec.status === "completed" || updatedExec.status === "failed") {
      // Optionally close connection from server side or let client handle it
      // res.end();
    }
  };

  executionStore.on(`update:${id}`, onUpdate);

  // Cleanup
  req.on("close", () => {
    executionStore.off(`update:${id}`, onUpdate);
  });
});

export default router;
