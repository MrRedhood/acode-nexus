import GeminiProvider from "../providers/gemini.js";
import StorageService from "./storage-service.js";
import SessionService from "./session-service.js";

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

    const remaining = match[2] || "";

    if (!COMMANDS[command]) {
      return null;
    }

    return {
      command,
      content: remaining
    };
  }

  static preprocessMessages(messages) {
    const processed =
      messages.map(msg => ({ ...msg }));

    for (
      let i = processed.length - 1;
      i >= 0;
      i--
    ) {
      const msg = processed[i];

      if (msg.role !== "user") {
        continue;
      }

      const parsed =
        this.parseSlashCommand(
          msg.content
        );

      if (!parsed) {
        continue;
      }

      let content =
        parsed.content;

      if (!content.trim()) {
        content =
          "[No additional content provided]";
      }

      msg.content =
        COMMANDS[
          parsed.command
        ].prefix + content;

      break;
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

    throw new Error("Unsupported provider");
  }

  static async sendMessage(
    signal = null
  ) {
    const provider =
      StorageService.get("provider");

    const apiKey =
      StorageService.get("apiKey");

    const model =
      StorageService.get("model");

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
          role: msg.role,
          content: msg.content
        }));

    const processedMessages =
      this.preprocessMessages(
        cleanedMessages
      );

    if (provider === "gemini") {
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
}