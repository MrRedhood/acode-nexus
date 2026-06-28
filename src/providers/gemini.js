export default class GeminiProvider {
  static mergeSignals(
    externalSignal,
    timeout = 15000
  ) {
    const controller =
      new AbortController();

    let aborted = false;

    const abort = () => {
      if (aborted) return;
      aborted = true;
      controller.abort();
    };

    const timer =
      setTimeout(
        abort,
        timeout
      );

    if (externalSignal) {
      if (
        externalSignal.aborted
      ) {
        abort();
      } else {
        externalSignal.addEventListener(
          "abort",
          abort
        );
      }
    }

    return {
      signal:
        controller.signal,
      cleanup() {
        clearTimeout(timer);

        if (
          externalSignal
        ) {
          externalSignal.removeEventListener(
            "abort",
            abort
          );
        }
      }
    };
  }

  static async fetchWithTimeout(
    url,
    options = {},
    timeout = 15000
  ) {
    const {
      signal,
      cleanup
    } = this.mergeSignals(
      options.signal,
      timeout
    );

    try {
      return await fetch(url, {
        ...options,
        signal
      });
    } finally {
      cleanup();
    }
  }

  static async parseError(
    response
  ) {
    const text =
      await response.text();

    try {
      const json =
        JSON.parse(text);

      return (
        json?.error
          ?.message ||
        text
      );
    } catch {
      return text;
    }
  }

  static async getModels(
    apiKey
  ) {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    const response =
      await this.fetchWithTimeout(
        url,
        {},
        30000
      );

    if (!response.ok) {
      throw new Error(
        await this.parseError(
          response
        )
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
              `[Attachment: ${attachment.name}]\n\n${attachment.content}`
          });
        }
      }
    }

    if (!parts.length) {
      parts.push({
        text: "[Empty]"
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
    const parts =
      payload
        ?.candidates?.[0]
        ?.content?.parts;

    if (
      !parts ||
      !parts.length
    ) {
      return "";
    }

    return parts
      .map(
        part =>
          part.text || ""
      )
      .join("");
  }

  static async chat(
    apiKey,
    model,
    messages,
    signal = null
  ) {
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
        60000
      );

    if (!response.ok) {
      throw new Error(
        await this.parseError(
          response
        )
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
  }

  static async streamChat(
    apiKey,
    model,
    messages,
    onChunk,
    signal = null
  ) {
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
        60000
      );

    if (!response.ok) {
      throw new Error(
        await this.parseError(
          response
        )
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

      buffer +=
        decoder.decode(
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

        if (
          jsonText ===
          "[DONE]"
        ) {
          continue;
        }

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

          fullText +=
            chunk;

          console.log(
            "[Gemini chunk]",
            chunk
          );

          if (onChunk) {
            onChunk(
              fullText,
              chunk
            );
          }
        } catch (error) {
          console.warn(
            "Stream parse skip:",
            error,
            jsonText
          );
        }
      }
    }

    return (
      fullText ||
      "No response returned."
    );
  }
}