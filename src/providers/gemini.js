export default class GeminiProvider {
  static async fetchWithTimeout(
    url,
    options = {},
    timeout = 15000
  ) {
    const controller =
      new AbortController();

    const timer =
      setTimeout(() => {
        controller.abort();
      }, timeout);

    try {
      const response =
        await fetch(url, {
          ...options,
          signal:
            options.signal ||
            controller.signal
        });

      clearTimeout(timer);
      return response;
    } catch (error) {
      clearTimeout(timer);
      throw error;
    }
  }

  static async getModels(apiKey) {
    console.log(
      "[Gemini] getModels start"
    );

    try {
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

      console.log(
        "[Gemini] fetching models"
      );

      const response =
        await this.fetchWithTimeout(
          url,
          {},
          15000
        );

      console.log(
        "[Gemini] status:",
        response.status
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          `Gemini API error ${response.status}: ${errorText}`
        );
      }

      const data =
        await response.json();

      console.log(
        "[Gemini] model count:",
        data.models?.length || 0
      );

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

  static async chat(
    apiKey,
    model,
    messages,
    signal = null
  ) {
    try {
      const contents =
        this.buildContents(
          messages
        );

      const response =
        await this.fetchWithTimeout(
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
          },
          30000
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
        this.extractChunkText(
          data
        ) ||
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

    static async streamChat(
    apiKey,
    model,
    messages,
    onChunk,
    signal = null
  ) {
    try {
      const contents =
        this.buildContents(
          messages
        );

      const response =
        await this.fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
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
          },
          30000
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText
        );
      }

      if (!response.body) {
        throw new Error(
          "Streaming not supported"
        );
      }

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let buffer = "";
      let fullText = "";

      while (true) {
        const {
          done,
          value
        } =
          await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(
          value,
          {
            stream: true
          }
        );

        const lines =
          buffer.split("\n");

        buffer =
          lines.pop() || "";

        for (const line of lines) {
          const trimmed =
            line.trim();

          if (
            !trimmed ||
            !trimmed.startsWith(
              "data:"
            )
          ) {
            continue;
          }

          const jsonText =
            trimmed.replace(
              /^data:\s*/,
              ""
            );

          try {
            const payload =
              JSON.parse(
                jsonText
              );

            const chunk =
              this.extractChunkText(
                payload
              );

            if (!chunk) {
              continue;
            }

            fullText += chunk;

            if (onChunk) {
              onChunk(
                fullText,
                chunk
              );
            }
          } catch (error) {
            console.warn(
              "Stream parse skip:",
              error
            );
          }
        }
      }

      return (
        fullText ||
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
        "[Gemini] streamChat failed:",
        error
      );

      throw error;
    }
  }
}