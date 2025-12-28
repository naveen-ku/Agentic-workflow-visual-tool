/**
 * CriterionResult is the atomic “why” unit
 * Every failure must explain exactly why
 */
export interface CriterionResult {
  criterion: string
  passed: boolean
  detail: string
}

export interface Evaluation {
  artifactId: string
  qualified: boolean
  criteriaResults: CriterionResult[]
}
