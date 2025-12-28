import { XRay } from "../core/XRay";

export interface IWorkflow {
  name: string;
  run(userInput: string, xray: XRay): Promise<void>;
}
