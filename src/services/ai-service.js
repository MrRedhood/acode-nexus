import GeminiProvider from "../providers/gemini.js";
import StorageService from "./storage-service.js";
import SessionService from "./session-service.js";
import AttachmentStorage from "./attachment-storage.js";
import ContextManager from "./context-manager.js";
import SearchService from "./search-service.js";

const MAX_ATTACHMENT_CHARS =
  120000;

const MAX_TOTAL_ATTACHMENT_CHARS =
  250000;

const COMMANDS = {
  explain: {
    prefix: `You are an expert teacher.

Tasks:
1. Explain clearly step by step
2. Use simple language
3. Include examples when useful

User request:
`
  },

  fix: {
    prefix: `You are a debugging assistant.

Tasks:
1. Find bugs
2. Explain root cause
3. Provide corrected code
4. Mention improvements

User request:
`
  },

  refactor: {
    prefix: `You are a senior software engineer.

Tasks:
1. Improve code structure
2. Improve readability
3. Reduce duplication
4. Keep behavior unchanged

User request:
`
  },

  optimize: {
    prefix: `You are a performance optimization expert.

Tasks:
1. Improve speed
2. Reduce memory usage
3. Improve complexity
4. Explain tradeoffs

User request:
`
  },

  summarize: {
    prefix: `Summarize the following content.

Rules:
1. Keep important points
2. Remove fluff
3. Use bullet points

Content:
`
  }
};

export default class AIService {
  static parseSlashCommand(text) {
    if (!text.startsWith("/")) {
      return null;
    }

    const match =
      text.match(/^\/(\w+)\s*(.*)$/);

    if (!match) {
      return null;
    }

    const command =
      match[1].toLowerCase();

    const remaining =
      match[2] || "";

    if (
      command !== "search" &&
      !COMMANDS[command]
    ) {
      return null;
    }

    return {
      command,
      content: remaining
    };
  }

  static async getMessageAttachments(
    message
  ) {
    if (
      !message ||
      !message.attachmentIds ||
      message.attachmentIds.length === 0
    ) {
      return [];
    }

    const attachments = [];

    for (const id of message.attachmentIds) {
      try {
        const attachment =
          await AttachmentStorage.getAttachment(
            id
          );

        if (attachment) {
          attachments.push(
            attachment
          );
        }
      } catch (error) {
        console.error(
          "Attachment read failed:",
          error
        );
      }
    }

    return attachments;
  }

  static attachmentToText(
    attachment,
    remainingBudget
  ) {
    if (!attachment) {
      return {
        text: "",
        usedChars: 0
      };
    }

    const typeLabel =
      attachment.type ===
      "clipboard"
        ? "CLIPBOARD"
        : attachment.type ===
          "current-file"
        ? "CURRENT FILE"
        : "FILE";

    const content =
      attachment.content || "";

    const allowedChars =
      Math.max(
        0,
        Math.min(
          MAX_ATTACHMENT_CHARS,
          remainingBudget
        )
      );

    const truncated =
      content.length >
      allowedChars;

    const finalContent =
      truncated
        ? content.slice(
            0,
            allowedChars
          )
        : content;

    const warning =
      truncated
        ? `

WARNING: Attachment truncated
Original size: ${content.length} chars
Sent size: ${finalContent.length} chars`
        : "";

    return {
      text: `[${typeLabel} ATTACHMENT]
Name: ${attachment.name}${warning}

Content:
${finalContent}`,
      usedChars:
        finalContent.length
    };
  }

  static async preprocessMessages(
    messages
  ) {
    const processed = [];

    for (const msg of messages) {
      const cloned = {
        ...msg
      };

      const attachments =
        await this.getMessageAttachments(
          cloned
        );

      if (
        cloned.role === "user"
      ) {
        const originalContent =
          cloned.content;

        const parsed =
          this.parseSlashCommand(
            cloned.content
          );

        if (parsed) {
          let content =
            parsed.content;

          if (
            !content.trim()
          ) {
            content =
              "[No additional content provided]";
          }

          if (
            parsed.command ===
            "search"
          ) {
            const fileResults =
              SearchService.searchFiles(
                content
              );

            const codeResults =
              await SearchService.searchCode(
                content
              );

            const workspaceText =
              fileResults.length
                ? fileResults
                    .map(
                      file =>
                        `- ${file.name} (${file.path})`
                    )
                    .join("\n")
                : "No matching files";

                        const codeText =
              codeResults.length
                ? codeResults
                    .slice(0, 20)
                    .map(
                      match =>
                        `FILE: ${match.file}
LINE: ${match.line}

${match.snippet || match.text}`
                    )
                    .join(
                      "\n\n--------------------\n\n"
                    )
                : "No code matches";

            cloned.content = `
Search query: ${content}

Workspace matches:
${workspaceText}

Code matches:
${codeText}
`;
          } else {
            cloned.content =
              COMMANDS[
                parsed.command
              ].prefix + content;
          }
        } else {
          const lower =
            originalContent.toLowerCase();

          const searchHints = [
            "where is ",
            "find ",
            "implemented",
            "defined",
            "locate"
          ];

          const needsSearch =
            searchHints.some(
              hint =>
                lower.includes(
                  hint
                )
            );

          if (needsSearch) {
            const words =
              originalContent.match(
                /[A-Za-z_][A-Za-z0-9_]*/g
              ) || [];

            const symbol =
              words.find(
                word =>
                  word.length > 3
              );

            if (symbol) {
              const results =
                await SearchService.searchCode(
                  symbol
                );

              if (
                results.length
              ) {
                const toolContext =
                  results
                    .slice(0, 10)
                    .map(
                      match =>
                        `FILE: ${match.file}
LINE: ${match.line}

${match.snippet || match.text}`
                    )
                    .join(
                      "\n\n====================\n\n"
                    );

                cloned.content =
                  `${originalContent}

Relevant code search results:
${toolContext}`;
              }
            }
          }
        }

        if (
          attachments.length > 0
        ) {
          let remainingBudget =
            MAX_TOTAL_ATTACHMENT_CHARS;

          const attachmentTexts =
            [];

          for (const att of attachments) {
            if (
              remainingBudget <= 0
            ) {
              attachmentTexts.push(
                "[ATTACHMENT SKIPPED: Budget exceeded]"
              );
              continue;
            }

            const result =
              this.attachmentToText(
                att,
                remainingBudget
              );

            attachmentTexts.push(
              result.text
            );

            remainingBudget -=
              result.usedChars;
          }

                    cloned.content +=
            "\n\nAttached Files:\n\n" +
            attachmentTexts.join(
              "\n\n"
            );
        }
      }

      processed.push(
        cloned
      );
    }

    return processed;
  }

  static async getModels(
    provider = null,
    apiKey = null
  ) {
    provider ??=
      StorageService.get(
        "provider"
      );

    apiKey ??=
      StorageService.get(
        "apiKey"
      );

    if (
      !provider ||
      !apiKey
    ) {
      throw new Error(
        "Provider or API key missing"
      );
    }

    if (
      provider ===
      "gemini"
    ) {
      return await GeminiProvider.getModels(
        apiKey
      );
    }

    throw new Error(
      "Unsupported provider"
    );
  }

  static async prepareMessages() {
    const provider =
      StorageService.get(
        "provider"
      );

    const apiKey =
      StorageService.get(
        "apiKey"
      );

    const model =
      StorageService.get(
        "model"
      );

    if (!provider) {
      throw new Error(
        "No provider selected"
      );
    }

    if (!apiKey) {
      throw new Error(
        "No API key saved"
      );
    }

    if (!model) {
      throw new Error(
        "No model selected"
      );
    }

    const messages =
      SessionService.getMessages();

    if (!messages.length) {
      throw new Error(
        "No messages found"
      );
    }

    const cleanedMessages =
      messages
        .filter(
          msg =>
            msg &&
            msg.role &&
            typeof msg.content ===
              "string"
        )
        .map(msg => ({
          ...msg
        }));

    let processedMessages =
      await this.preprocessMessages(
        cleanedMessages
      );

    processedMessages =
      ContextManager.prepareMessages(
        processedMessages
      );

    return {
      provider,
      apiKey,
      model,
      processedMessages
    };
  }

  static async sendMessage(
    signal = null
  ) {
    const {
      provider,
      apiKey,
      model,
      processedMessages
    } =
      await this.prepareMessages();

    if (
      provider ===
      "gemini"
    ) {
      return await GeminiProvider.chat(
        apiKey,
        model,
        processedMessages,
        signal
      );
    }

    throw new Error(
      "Unsupported provider"
    );
  }

  static async sendMessageStream(
    onChunk,
    signal = null
  ) {
    const {
      provider,
      apiKey,
      model,
      processedMessages
    } =
      await this.prepareMessages();

    if (
      provider ===
      "gemini"
    ) {
      console.log(
  "FINAL MESSAGES:",
  processedMessages
);
      return await GeminiProvider.streamChat(
        apiKey,
        model,
        processedMessages,
        onChunk,
        signal
      );
    }

    throw new Error(
      "Unsupported provider"
    );
  }
}