// backend/src/routes/executions.ts
import { Router } from "express"
import { executionStore } from "../store/executionStore"

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

export default router
