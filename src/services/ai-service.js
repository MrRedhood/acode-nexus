import GeminiProvider from "../providers/gemini.js";
import StorageService from "./storage-service.js";
import SessionService from "./session-service.js";
import AttachmentService from "./attachment-service.js";
import TokenBudgetService from "./token-budget-service.js";
import MentionService from "./mention-service.js";
import LiveContextService from "./live-context-service.js";
import RouterService from "./router-service.js";
import EditService from "./edit-service.js";
import PromptService from "./prompt-service.js";

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
  static getActiveFileContext() {
    try {
      if (
        !editorManager ||
        !editorManager.activeFile
      ) {
        return "";
      }

      const file =
        editorManager.activeFile;

      if (!file.session) {
        return "";
      }

      const content =
        file.session.getValue();

      if (!content) {
        return "";
      }

      return `
ACTIVE FILE (LIVE EDITOR BUFFER)

File:
${file.name || file.filename}

IMPORTANT:
This is the latest unsaved editor content.
Use this exact content for patch_file.

${content}
`;
    } catch (error) {
      console.error(
        "getActiveFileContext failed:",
        error
      );
      return "";
    }
  }

  static shouldInjectLiveFile(
    text
  ) {
    if (!text) {
      return false;
    }

    const lower =
      text.toLowerCase();

    const editWords = [
      "patch",
      "modify",
      "replace",
      "change",
      "add",
      "remove",
      "update",
      "edit",
      "insert"
    ];

    return editWords.some(
      word =>
        lower.includes(word)
    );
  }

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

    static async preprocessMessages(
    messages
  ) {
    const processed = [];

    for (const msg of messages) {
      const cloned = {
        ...msg
      };

      const attachments =
        await AttachmentService.getMessageAttachments(
          cloned
        );

      if (
        cloned.role === "user"
      ) {
        if (
          LiveContextService.shouldInject(
            cloned.content
          )
        ) {
          const liveContext =
            LiveContextService.getContext();

          if (liveContext) {
            cloned.content =
              liveContext +
              "\n\n" +
              cloned.content;
          }
        }

        const mentionResult =
          await MentionService.buildMentionContext(
            cloned.content
          );

        if (
          mentionResult.context
        ) {
          cloned.content =
            `Referenced files:

${mentionResult.context}

User request:
${mentionResult.content}`;
        }

        if (
          this.shouldInjectLiveFile(
            cloned.content
          )
        ) {
          const liveContext =
            this.getActiveFileContext();

          if (liveContext) {
            cloned.content =
              liveContext +
              "\n\n" +
              cloned.content;
          }
        }

        const parsed =
          this.parseSlashCommand(
            mentionResult.content
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

          cloned.content =
            COMMANDS[
              parsed.command
            ]?.prefix
              ? COMMANDS[
                  parsed.command
                ].prefix + content
              : content;
        }

        if (
          attachments.length > 0
        ) {
          let remainingBudget =
            AttachmentService.MAX_TOTAL_ATTACHMENT_CHARS;

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
              AttachmentService.attachmentToText(
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

      processed.push(cloned);
    }

    return processed;
  }

    static async getModels(
    provider = null,
    apiKey = null
  ) {
    provider ??=
      StorageService.get("provider");

    apiKey ??=
      StorageService.get("apiKey");

    if (!provider || !apiKey) {
      throw new Error(
        "Provider or API key missing"
      );
    }

    if (provider === "gemini") {
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
      StorageService.get("provider");

    const apiKey =
      StorageService.get("apiKey");

    const model =
      StorageService.get("model");

    const messages =
      SessionService.getMessages();

    const cleanedMessages =
      messages
        .filter(
          msg =>
            msg &&
            msg.role &&
            typeof msg.content ===
              "string"
        )
        .map(msg => ({ ...msg }));

    let processedMessages =
      await this.preprocessMessages(
        cleanedMessages
      );

    const systemPrompt =
      PromptService.buildChatPrompt();

    if (systemPrompt) {
      processedMessages.unshift({
        role: "system",
        content: systemPrompt
      });
    }

    processedMessages =
      TokenBudgetService.enforceBudget(
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
    const payload =
      await this.prepareMessages();

    if (
      payload.provider ===
      "gemini"
    ) {
      return await GeminiProvider.chat(
        payload.apiKey,
        payload.model,
        payload.processedMessages,
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
    const messages =
      SessionService.getMessages();

    if (
      RouterService.isEditRequest(
        messages
      )
    ) {
      return await EditService.sendMessageStream(
        messages,
        onChunk,
        signal
      );
    }

    const payload =
      await this.prepareMessages();

    if (
      payload.provider ===
      "gemini"
    ) {
      return await GeminiProvider.streamChat(
        payload.apiKey,
        payload.model,
        payload.processedMessages,
        onChunk,
        signal
      );
    }

    throw new Error(
      "Unsupported provider"
    );
  }
}