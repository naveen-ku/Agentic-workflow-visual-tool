import { OpenAIService } from "./OpenAIService";
import { PROMPTS, ARTIFACT_LABELS, CRITERIA } from "../constants";
import { XRayStep } from "../core/XRayStep";

export class DynamicFilterService {
  private openai: OpenAIService;

  constructor() {
    this.openai = OpenAIService.getInstance();
  }

  /**
   * Applies schema-agnostic filtering to a list of items.
   * 1. Infers schema from the first item.
   * 2. Asks LLM to generate filter rules based on schema + user input.
   * 3. Applies rules and records detailed evaluations.
   */
  async applyFilter(
    step: XRayStep,
    items: any[],
    userInput: string
  ): Promise<any[]> {
    if (!items || items.length === 0) return [];

    // 1. Calculate Stats (Schema + Range)
    const schema = this.calculateStats(items);
    console.info("[DynamicFilterService] infered Stats: ", schema);

    // 2. Generate Rules using LLM
    const prompt = PROMPTS.DYNAMIC_FILTER(userInput, items.length, schema);
    const filterSpec = await this.openai.generateJson<{
      rules: Array<{
        field: string;
        operator: ">" | "<" | ">=" | "<=" | "==" | "!=" | "contains";
        value: any;
      }>;
      reasoning: string;
    }>(prompt);
    console.info("[DynamicFilterService] filterSpec: ", filterSpec);

    step.setReasoning(filterSpec.reasoning);

    // 3. Evaluate each item against rules
    const candidateEvaluations = items.map((item) => {
      const evaluationRules: Record<string, any> = {};
      let allPassed = true;

      for (const rule of filterSpec.rules) {
        const itemValue = this.getNestedValue(item, rule.field);
        const passed = this.evaluateRule(itemValue, rule.operator, rule.value);

        evaluationRules[rule.field] = {
          passed,
          detail: `${rule.field}: ${JSON.stringify(itemValue)} ${
            rule.operator
          } ${JSON.stringify(rule.value)}`,
        };

        if (!passed) allPassed = false;
      }

      // If no rules were generated, everything passes
      if (filterSpec.rules.length === 0) allPassed = true;

      return {
        item: item.title || item.name || "Item", // Best-guess label
        ...this.extractMetrics(item, schema), // Include metrics for display
        rules: evaluationRules,
        qualified: allPassed,
        originalItem: item,
      };
    });

    // 4. Record Artifacts
    const filteredResults = candidateEvaluations
      .filter((c) => c.qualified)
      .map((c) => c.originalItem);

    step.addArtifact(
      ARTIFACT_LABELS.CANDIDATE_EVALUATIONS,
      candidateEvaluations
    );

    const droppedCount = items.length - filteredResults.length;
    const logicArtifactId = step.addArtifact(ARTIFACT_LABELS.FILTER_LOGIC, {
      schema,
      generatedRules: filterSpec.rules,
      dropped: droppedCount,
    });

    step.evaluateArtifact(logicArtifactId, [
      {
        criterion: CRITERIA.FILTER_APPLIED,
        passed: filteredResults.length > 0,
        detail:
          droppedCount > 0
            ? `Dropped ${droppedCount} items based on dynamic rules.`
            : "No items dropped.",
      },
    ]);

    return filteredResults;
  }

  private calculateStats(items: any[]): Record<string, string> {
    if (items.length === 0) return {};
    const schema: Record<string, string> = {};
    const sample = items[0];

    // Helper to flatten keys
    const flatten = (obj: any, prefix = ""): string[] => {
      let keys: string[] = [];
      for (const key in obj) {
        if (
          typeof obj[key] === "object" &&
          obj[key] !== null &&
          !Array.isArray(obj[key])
        ) {
          keys = keys.concat(flatten(obj[key], `${prefix}${key}.`));
        } else {
          keys.push(`${prefix}${key}`);
        }
      }
      return keys;
    };

    const keys = flatten(sample);

    for (const key of keys) {
      const values = items.map((i) => this.getNestedValue(i, key));
      const type = typeof values[0];

      if (type === "number") {
        const min = Math.min(...values);
        const max = Math.max(...values);
        schema[key] = `number (min: ${min}, max: ${max})`;
      } else if (type === "string") {
        const unique = Array.from(new Set(values));
        if (unique.length < 10) {
          schema[key] = `string (enum: ${unique.join(", ")})`;
        } else {
          schema[key] = `string (examples: ${unique.slice(0, 3).join(", ")})`;
        }
      } else {
        schema[key] = type;
      }
    }
    return schema;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((o, key) => (o ? o[key] : undefined), obj);
  }

  private evaluateRule(actual: any, operator: string, target: any): boolean {
    if (actual === undefined || actual === null) return false;
    switch (operator) {
      case ">":
        return actual > target;
      case "<":
        return actual < target;
      case ">=":
        return actual >= target;
      case "<=":
        return actual <= target;
      case "==":
        return String(actual).toLowerCase() === String(target).toLowerCase();
      case "!=":
        return String(actual).toLowerCase() !== String(target).toLowerCase();
      case "contains":
        return String(actual)
          .toLowerCase()
          .includes(String(target).toLowerCase());
      default:
        return false;
    }
  }

  private extractMetrics(item: any, schema: Record<string, string>): any {
    const metrics: any = {};
    // Extract top-level numbers/strings for display context
    // This is heuristic; in a real app, we might want explicit display config
    for (const key in item) {
      if (typeof item[key] === "number") metrics[key] = item[key];
      if (key === "difficulty_level") metrics[key] = item[key]; // Spec for blog
    }
    // Also grab nested metrics if they exist
    if (item.metrics) {
      Object.assign(metrics, item.metrics);
    }
    return metrics;
  }
}
