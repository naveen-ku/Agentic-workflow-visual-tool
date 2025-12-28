import { XRay } from "../core/XRay";
import { IWorkflow } from "../workflows/IWorkflow";
import { ProductSearchWorkflow } from "../workflows/ProductSearchWorkflow";
import { BlogRecommendationWorkflow } from "../workflows/BlogRecommendationWorkflow";

export class XRayService {
  async run(userInput: string): Promise<string> {
    const xray = new XRay();
    // Use the user's input as the execution name
    xray.startExecution(userInput, {
      originalRequest: userInput,
    });

    // Save initial state
    xray.saveState();

    try {
      // Strategy Dispatcher: Select workflow based on intent
      let workflow: IWorkflow;
      const lowerInput = userInput.toLowerCase();

      if (
        lowerInput.includes("blog") ||
        lowerInput.includes("article") ||
        lowerInput.includes("post")
      ) {
        workflow = new BlogRecommendationWorkflow();
      } else {
        workflow = new ProductSearchWorkflow(); // Default
      }

      // Execute Workflow
      await workflow.run(userInput, xray);
    } catch (e: any) {
      console.error("XRay Execution Failed", e);
      // Ensure we log failure if the workflow itself didn't catch it
      const errorStep = xray.startStep("Execution Failed", "custom", {
        error: e.message,
      });
      xray.endStep(errorStep);
      xray.saveState();
    } finally {
      xray.endExecution();
      xray.saveState();
    }

    return xray.getExecutionId() || "";
  }
}

export const xrayService = new XRayService();
