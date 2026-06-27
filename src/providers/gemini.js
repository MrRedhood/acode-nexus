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

  static buildParts(
    message
  ) {
    const parts = [];

    if (
      message.content &&
      message.content.trim()
    ) {
      parts.push({
        text:
          message.content
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

  static buildContents(
    messages
  ) {
    return messages.map(
      msg => ({
        role:
          msg.role ===
          "assistant"
            ? "model"
            : "user",

        parts:
          this.buildParts(
            msg
          )
      })
    );
  }

  static extractChunkText(
    payload
  ) {
    return (
      payload?.candidates?.[0]
        ?.content?.parts?.[0]
        ?.text || ""
    );
  }