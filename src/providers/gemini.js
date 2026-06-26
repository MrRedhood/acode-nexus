export default class GeminiProvider {
  static async getModels(apiKey) {
    try {
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

      const response =
        await fetch(url);

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          `Gemini API error ${response.status}: ${errorText}`
        );
      }

      const data =
        await response.json();

      return (
        data.models || []
      )
        .filter(model => {
          const id =
            model.name.replace(
              "models/",
              ""
            );

          const hasGenerate =
            model.supportedGenerationMethods?.includes(
              "generateContent"
            );

          const badTypes =
            id.includes(
              "embedding"
            ) ||
            id.includes(
              "tts"
            ) ||
            id.includes(
              "aqa"
            );

          return (
            hasGenerate &&
            !badTypes
          );
        })
        .map(model => ({
          id:
            model.name.replace(
              "models/",
              ""
            ),
          name:
            model.name.replace(
              "models/",
              ""
            )
        }));
    } catch (error) {
      console.error(
        "[Gemini] getModels failed:",
        error
      );

      throw error;
    }
  }

  static buildParts(message) {
    const parts = [];

    if (
      message.content &&
      message.content.trim()
    ) {
      parts.push({
        text: message.content
      });
    }

    if (
      message.attachments &&
      message.attachments.length
    ) {
      for (const attachment of message.attachments) {
        if (
          attachment.data &&
          attachment.mimeType
        ) {
          parts.push({
            inline_data: {
              mime_type:
                attachment.mimeType,
              data:
                attachment.data
            }
          });
        } else if (
          attachment.content
        ) {
          parts.push({
            text:
              `[Attachment: ${attachment.name}]\n\n` +
              attachment.content
          });
        }
      }
    }

    if (!parts.length) {
      parts.push({
        text: ""
      });
    }

    return parts;
  }

  static async chat(
    apiKey,
    model,
    messages,
    signal = null
  ) {
    try {
      const contents =
        messages.map(msg => ({
          role:
            msg.role ===
            "assistant"
              ? "model"
              : "user",

          parts:
            this.buildParts(
              msg
            )
        }));

      const response =
        await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            signal,
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              contents
            })
          }
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText
        );
      }

      const data =
        await response.json();

      return (
        data?.candidates?.[0]
          ?.content?.parts?.[0]
          ?.text ||
        "No response returned."
      );
    } catch (error) {
      if (
        error.name ===
        "AbortError"
      ) {
        throw error;
      }

      console.error(
        "[Gemini] chat failed:",
        error
      );

      throw error;
    }
  }
}