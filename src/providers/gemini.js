export default class GeminiProvider {
  static async getModels(apiKey) {
    try {
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Gemini API error ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();

      return (data.models || [])
        .filter(model => {
          const id = model.name.replace("models/", "");

          const hasGenerate =
            model.supportedGenerationMethods?.includes(
              "generateContent"
            );

          const badTypes =
            id.includes("embedding") ||
            id.includes("image") ||
            id.includes("tts") ||
            id.includes("robotics") ||
            id.includes("vision") ||
            id.includes("aqa");

          return hasGenerate && !badTypes;
        })
        .map(model => ({
          id: model.name.replace("models/", ""),
          name: model.name.replace("models/", "")
        }));
    } catch (error) {
      console.error("[Gemini] getModels failed:", error);
      throw error;
    }
  }

  static async chat(apiKey, model, messages) {
    try {
      const contents = messages.map(msg => ({
        role:
          msg.role === "assistant"
            ? "model"
            : "user",
        parts: [
          {
            text: msg.content
          }
        ]
      }));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();

      return (
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response returned."
      );
    } catch (error) {
      console.error("[Gemini] chat failed:", error);
      throw error;
    }
  }
}