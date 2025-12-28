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
   *
   * @param step - The current XRay step for artifact recording.
   * @param items - The list of data items to filter.
   * @param userInput - The user's specific query.
   * @returns The filtered subset of items.
   */
  async applyFilter(
    step: XRayStep,
    items: any[],
    userInput: string
  ): Promise<any[]> {
    if (!items || items.length === 0) return [];

    const schema = this.calculateStats(items);
    const prompt = PROMPTS.DYNAMIC_FILTER(userInput, items.length, schema);

    const filterSpec = await this.openai.generateJson<{
      rules: Array<{
        field: string;
        operator: ">" | "<" | ">=" | "<=" | "==" | "!=" | "contains";
        value: any;
      }>;
      reasoning: string;
    }>(prompt);

    step.setReasoning(filterSpec.reasoning);

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

      if (filterSpec.rules.length === 0) allPassed = true;

      return {
        item: item.title || item.name || "Item",
        ...this.extractMetrics(item, schema),
        rules: evaluationRules,
        qualified: allPassed,
        originalItem: item,
      };
    });

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

  /**
   * Infers the schema types and ranges/enums from a dataset.
   */
  private calculateStats(items: any[]): Record<string, string> {
    if (items.length === 0) return {};
    const schema: Record<string, string> = {};
    const sample = items[0];

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

  /**
   * Safely retrieves a nested property value from an object using dot notation.
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((o, key) => (o ? o[key] : undefined), obj);
  }

  /**
   * Evaluates a single filter rule against a value.
   */
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

  /**
   * Extracts relevant metrics from an item for display in the UI.
   */
  private extractMetrics(item: any, schema: Record<string, string>): any {
    const metrics: any = {};
    for (const key in item) {
      if (typeof item[key] === "number") metrics[key] = item[key];
      if (key === "difficulty_level") metrics[key] = item[key];
    }
    if (item.metrics) {
      Object.assign(metrics, item.metrics);
    }
    return metrics;
  }
}
