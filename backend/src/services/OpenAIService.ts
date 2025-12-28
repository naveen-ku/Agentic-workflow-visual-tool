import OpenAI from "openai";

export class OpenAIService {
  private static instance: OpenAIService;
  private openai: OpenAI;

  private constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("OPENAI_API_KEY is not set. OpenAI calls will fail.");
    }
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  async generate(
    prompt: string,
    model: string = "gpt-4-turbo"
  ): Promise<string> {
    console.info("[OpenAIService] generate() start...", { model });
    try {
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: prompt }],
      });
      console.info("[OpenAIService] generate() end...");
      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("OpenAI Generate Error:", error);
      throw error;
    }
  }

  async generateJson<T>(
    prompt: string,
    model: string = "gpt-4-turbo"
  ): Promise<T> {
    console.info("[OpenAIService] generateJson() start...", { model });
    try {
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that outputs strictly valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });
      const content = response.choices[0].message.content || "{}";
      console.info("[OpenAIService] generateJson() end...");
      return JSON.parse(content) as T;
    } catch (error) {
      console.error("OpenAI Generate JSON Error:", error);
      throw error;
    }
  }
}
