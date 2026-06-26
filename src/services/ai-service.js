import GeminiProvider from "../providers/gemini.js";
import StorageService from "./storage-service.js";
import SessionService from "./session-service.js";
import AttachmentStorage from "./attachment-storage.js";

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

    if (!COMMANDS[command]) {
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
    attachment
  ) {
    if (!attachment) {
      return "";
    }

    if (
      attachment.type ===
      "image"
    ) {
      return `[IMAGE ATTACHMENT]
Name: ${attachment.name}`;
    }

    if (
      attachment.type ===
      "pdf"
    ) {
      return `[PDF ATTACHMENT]
Name: ${attachment.name}`;
    }

    return `[FILE ATTACHMENT]
Name: ${attachment.name}

Content:
${attachment.content || ""}`;
  }

  