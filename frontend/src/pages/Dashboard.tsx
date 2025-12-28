// src/pages/Dashboard.tsx
import { useEffect } from "react"
import {
  loadExecutions,
  loadExecutionById,
} from "../store/executionSlice"
import { ExecutionList } from "../features/executions/ExecutionList"
import { ExecutionDetail } from "../features/executions/ExecutionDetail"
import { useAppDispatch, useAppSelector } from "../hooks"

export function Dashboard() {
  const dispatch = useAppDispatch()
  const { executions, selected, loading } = useAppSelector(
    state => state.executions
  )

  useEffect(() => {
    dispatch(loadExecutions())
  }, [dispatch])

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="flex h-screen">
      <ExecutionList
        executions={executions}
        selectedId={selected?.executionId}
        onSelect={id => dispatch(loadExecutionById(id))}
      />
      {selected && <ExecutionDetail execution={selected} />}
    </div>
  )
}
