import OpenAI from "openai";

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("OPENAI_API_KEY is not set. OpenAI calls will fail.");
    }
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generate(
    prompt: string,
    model: string = "gpt-oss-120b"
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: prompt }],
      });
      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("OpenAI Generate Error:", error);
      throw error;
    }
  }

  async generateJson<T>(
    prompt: string,
    model: string = "gpt-oss-120b"
  ): Promise<T> {
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
      return JSON.parse(content) as T;
    } catch (error) {
      console.error("OpenAI Generate JSON Error:", error);
      throw error;
    }
  }
}
