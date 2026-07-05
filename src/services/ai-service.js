import GeminiProvider from "../providers/gemini.js";
import StorageService from "./storage-service.js";
import SessionService from "./session-service.js";
import AttachmentStorage from "./attachment-storage.js";
import ContextManager from "./context-manager.js";
import SearchService from "./search-service.js";
import WorkspaceSummaryService from "./workspace-summary-service.js";
import LiveContextService from "./live-context-service.js";
import RouterService from "./router-service.js";
import EditService from "./edit-service.js";

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

  static buildWorkspaceContext() {
    const summary =
      WorkspaceSummaryService.getSummary();

    const actionProtocol = `
NEXUS ACTION PROTOCOL

You are running inside Acode Nexus.

IMPORTANT:
When user wants editor actions
(open file, focus file, modify file),
respond ONLY with nexus action blocks.

Supported actions:

Open file:
\`\`\`nexus-action
{
  "type": "open_file",
  "file": "search-service.js"
}
\`\`\`

Focus file:
\`\`\`nexus-action
{
  "type": "focus_file",
  "file": "search-service.js",
  "line": 120
}
\`\`\`

Patch file (preferred for edits):
\`\`\`nexus-action
{
  "type": "patch_file",
  "file": "search-service.js",
  "search": "OLD_CODE",
  "replace": "NEW_CODE"
}
\`\`\`

Replace file (only for full rewrites):
\`\`\`nexus-action
{
  "type": "replace_file",
  "file": "search-service.js",
  "content": "FULL FILE CONTENT"
}
\`\`\`

Rules:
1. Prefer patch_file for partial edits
2. Use replace_file only for full file rewrites
3. patch_file search must exactly match existing code
4. Never say action succeeded
5. Never say action executed
6. Never narrate results
7. Output only action block
`;

    if (!summary) {
      return actionProtocol;
    }

    return `
${actionProtocol}

ACTIVE WORKSPACE SUMMARY

Workspace:
${summary.workspace}

Total files:
${summary.totalFiles}

Architecture:
- Core: ${summary.architecture.hasCore}
- Services: ${summary.architecture.hasServices}
- UI: ${summary.architecture.hasUI}
- Agents: ${summary.architecture.hasAgents}

Important modules:
${summary.keyModules
  .map(
    module =>
      `- ${module.name} (${module.path})`
  )
  .join("\n")}

Total symbols:
- Functions: ${summary.totals.functions}
- Classes: ${summary.totals.classes}
- Imports: ${summary.totals.imports}

IMPORTANT:
When user asks about this workspace,
assume they mean this project.
`;
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

  static parseFileMentions(text) {
    if (!text) {
      return {
        files: [],
        cleanedText: ""
      };
    }

    const matches =
      text.match(
        /@([A-Za-z0-9._\\-\\/]+)/g
      ) || [];

    const files =
      matches.map(
        item => item.slice(1)
      );

    const cleanedText =
      text
        .replace(
          /@([A-Za-z0-9._\\-\\/]+)/g,
          ""
        )
        .trim();

    return {
      files,
      cleanedText
    };
  }

  static async buildMentionContext(text) {
    const parsed =
      this.parseFileMentions(text);

    if (!parsed.files.length) {
      return {
        content: text,
        context: ""
      };
    }

    const chunks = [];

    for (const fileName of parsed.files) {
      const content =
        await SearchService.readFullFile(
          fileName
        );

      if (!content) {
        chunks.push(
`FILE: ${fileName}

[Unable to read file]`
        );
        continue;
      }

      chunks.push(
`FILE: ${fileName}

${content}`
      );
    }

    return {
      content:
        parsed.cleanedText ||
        "Explain this file.",
      context:
        chunks.join(
          "\n\n----------------\n\n"
        )
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
          await this.buildMentionContext(
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
        .map(msg => ({
          ...msg
        }));

    let processedMessages =
      await this.preprocessMessages(
        cleanedMessages
      );

    const workspaceContext =
      this.buildWorkspaceContext();

    if (workspaceContext) {
      processedMessages.unshift({
        role: "system",
        content:
          workspaceContext
      });
    }

    const hasLiveBuffer =
  processedMessages.some(
    msg =>
      msg.role === "user" &&
      msg.content.includes(
        "LIVE EDITOR BUFFER"
      )
  );

if (!hasLiveBuffer) {
  processedMessages =
    ContextManager.prepareMessages(
      processedMessages
    );
}

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

    const messages =
  SessionService.getMessages();

if (
  RouterService.isEditRequest(
    messages
  )
) {
  console.log(
    "ROUTED TO EDIT SERVICE"
  );

  return await EditService.sendMessageStream(
    messages,
    onChunk,
    signal
  );
}
    
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
        "FINAL MESSAGE CONTENT:",
        JSON.stringify(
          processedMessages,
          null,
          2
        )
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