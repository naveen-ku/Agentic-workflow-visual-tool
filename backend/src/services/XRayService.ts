import { XRay } from "../core/XRay";
import { IWorkflow } from "../workflows/IWorkflow";
import { ProductSearchWorkflow } from "../workflows/ProductSearchWorkflow";
import { BlogRecommendationWorkflow } from "../workflows/BlogRecommendationWorkflow";
import { OpenAIService } from "./OpenAIService";
import { PROMPTS, ARTIFACT_LABELS } from "../constants";

export class XRayService {
  private openai: OpenAIService;

  constructor() {
    this.openai = OpenAIService.getInstance();
  }

  /**
   * Starts a new execution session asynchronously.
   * Initializes the X-Ray context and saves the initial state.
   *
   * @param userInput - The natural language request from the user.
   * @returns The unique ID of the newly created execution.
   */
  async startExecution(userInput: string): Promise<string> {
    const xray = new XRay();
    xray.startExecution(userInput, {
      originalRequest: userInput,
    });
    xray.saveState();

    this.runWorkflow(xray, userInput).catch((err) => {
      console.error("Background workflow failed", err);
    });

    return xray.getExecutionId() || "";
  }

  /**
   * Orchestrates the entire workflow based on user intent.
   * 1. Classifies intent (Product vs Blog).
   * 2. Instantiates the appropriate workflow strategy.
   * 3. Executes the workflow.
   *
   * @param xray - The XRay execution context.
   * @param userInput - The original user request.
   */
  private async runWorkflow(xray: XRay, userInput: string): Promise<void> {
    try {
      const routerStep = xray.startStep("Intent Classification", "custom", {
        userInput,
      });

      const routerPrompt = PROMPTS.ROUTER(userInput);
      const routerResult = await this.openai.generateJson<{
        workflow: "PRODUCT_SEARCH" | "BLOG_RECOMMENDATION";
        reasoning: string;
      }>(routerPrompt);

      routerStep.setReasoning(routerResult.reasoning);
      routerStep.setOutput({ selectedWorkflow: routerResult.workflow });
      xray.endStep(routerStep);
      xray.saveState();

      let workflow: IWorkflow;
      if (routerResult.workflow === "BLOG_RECOMMENDATION") {
        workflow = new BlogRecommendationWorkflow();
      } else {
        workflow = new ProductSearchWorkflow(); // Default
      }

      await workflow.run(userInput, xray);
    } catch (e: any) {
      console.error("XRay Execution Failed", e);
      const errorStep = xray.startStep("Execution Failed", "custom", {
        error: e.message,
      });
      xray.endStep(errorStep);
      xray.failExecution(e.message);
      xray.saveState();
    } finally {
      xray.endExecution();
      xray.saveState();
    }
  }
}

export const xrayService = new XRayService();
