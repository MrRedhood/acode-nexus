export default class GeminiProvider {
  static async getModels(apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Gemini models");
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
      console.error(error);
      return [];
    }
  }

  static async chat(apiKey, model, message) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: message }
              ]
            }
          ]
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
  }
}