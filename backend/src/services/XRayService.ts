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

  async run(userInput: string): Promise<string> {
    console.info("[XRayService] run() start... ", userInput);
    const xray = new XRay();
    xray.startExecution(userInput, {
      originalRequest: userInput,
    });

    // Save initial state
    xray.saveState();

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
        console.info(
          "[XRayService] Router selected: BlogRecommendationWorkflow"
        );
        workflow = new BlogRecommendationWorkflow();
      } else {
        console.info("[XRayService] Router selected: ProductSearchWorkflow");
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
    console.info("[XRayService] run() end... ");
    return xray.getExecutionId() || "";
  }
}

export const xrayService = new XRayService();
