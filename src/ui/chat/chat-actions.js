import AIService from "../../services/ai-service.js";
import SessionService from "../../services/session-service.js";
import AttachmentStorage from "../../services/attachment-storage.js";
import SearchService from "../../services/search-service.js";
import CommandService from "../../services/command-service.js";
import ActionService from "../../services/action-service.js";
import parseMarkdown from "../../utils/markdown.js";

export default {
  stopGeneration() {
    if (this.activeController) {
      this.activeController.abort();
    }

    this.isGenerating = false;

    const sendBtn =
      this.container.querySelector(
        "#send-btn"
      );

    if (sendBtn) {
      sendBtn.textContent = "↑";
    }
  },

  startEditMessage(message) {
    const input =
      this.container.querySelector(
        "#chat-input"
      );

    this.editingMessageId =
      message.id;

    this.editingAttachmentIds = [
      ...(message.attachmentIds || [])
    ];

    input.value = message.content;
    input.focus();

    this.renderAttachmentPreview();
    this.autoResizeTextarea(input);
    this.updateTokenCounter();
  },

  async regenerateResponse() {
    if (this.isGenerating) {
      return;
    }

    SessionService.removeLastAssistantMessage();
    this.renderMessages();

    await this.generateAssistantReply();
  },

  async generateAssistantReply() {
    const sendBtn =
      this.container.querySelector(
        "#send-btn"
      );

    this.isGenerating = true;
    this.activeController =
      new AbortController();

    this.commandMenu.hide();
    sendBtn.textContent = "■";

    const thinkingNode =
      this.appendMessageObject(
        {
          id: "thinking",
          role: "assistant",
          content: "Thinking..."
        },
        false,
        false,
        true
      );

    this.startThinkingAnimation(
      thinkingNode
    );

    try {
      const assistantMessage = {
        id:
          "msg_" +
          Date.now() +
          "_" +
          Math.random()
            .toString(36)
            .slice(2),
        role: "assistant",
        content: ""
      };

      let assistantNode = null;

      const finalResponse =
        await AIService.sendMessageStream(
          fullText => {
            assistantMessage.content =
              fullText;

            if (
              thinkingNode &&
              thinkingNode.parentNode
            ) {
              this.stopThinkingAnimation();
              thinkingNode.remove();

              assistantNode =
                this.appendMessageObject(
                  {
                    id:
                      assistantMessage.id,
                    role:
                      "assistant",
                    content: ""
                  },
                  false,
                  true,
                  true
                );
            }

            if (assistantNode) {
              const actions =
                assistantNode.querySelector(
                  ".nexus-msg-actions"
                );

              assistantNode.innerHTML = `
                <strong>Nexus</strong><br>
                ${this.convertFileReferences(
                  parseMarkdown(
                    fullText
                  )
                )}
              `;

              if (actions) {
                assistantNode.appendChild(
                  actions
                );
              }

              this.attachCodeCopyListeners(
                assistantNode
              );

              this.attachFileReferenceListeners(
                assistantNode
              );

              const box =
                this.container.querySelector(
                  "#chat-messages"
                );

              if (box) {
                box.scrollTop =
                  box.scrollHeight;
              }
            }
          },
          this.activeController.signal
        );

            assistantMessage.content =
        finalResponse ||
        assistantMessage.content ||
        "No response returned.";

      if (!assistantNode) {
        this.stopThinkingAnimation();

        if (
          thinkingNode &&
          thinkingNode.parentNode
        ) {
          thinkingNode.remove();
        }

        assistantNode =
          this.appendMessageObject(
            assistantMessage,
            false,
            true,
            true
          );
      }

      if (assistantNode) {
        const actions =
          assistantNode.querySelector(
            ".nexus-msg-actions"
          );

        assistantNode.innerHTML = `
          <strong>Nexus</strong><br>
          ${this.convertFileReferences(
            parseMarkdown(
              assistantMessage.content
            )
          )}
        `;

        if (actions) {
          assistantNode.appendChild(
            actions
          );

          const copyBtn =
            assistantNode.querySelector(
              ".nexus-copy-btn"
            );

          if (copyBtn) {
            copyBtn.onclick = () => {
              this.copyText(
                assistantMessage.content
              );
            };
          }
        }

        this.attachCodeCopyListeners(
          assistantNode
        );

        this.attachFileReferenceListeners(
          assistantNode
        );
      }

      SessionService.addExistingMessage(
        assistantMessage
      );
    } catch (error) {
      this.stopThinkingAnimation();

      if (
        error &&
        error.name ===
          "AbortError"
      ) {
        if (
          thinkingNode &&
          thinkingNode.parentNode
        ) {
          thinkingNode.innerHTML =
            `<strong>Nexus</strong><br>Generation stopped`;
        }
      } else {
        if (
          thinkingNode &&
          thinkingNode.parentNode
        ) {
          thinkingNode.innerHTML =
            `<strong>Error</strong><br>${
              (error &&
                error.message) ||
              "Unknown error"
            }`;
        } else {
          this.showToast(
            (error &&
              error.message) ||
              "Generation failed"
          );
        }
      }
    } finally {
      this.activeController =
        null;

      this.isGenerating =
        false;

      sendBtn.textContent =
        "↑";
    }
  },

  async sendMessage() {
    if (this.isGenerating) {
      return;
    }

    const input =
      this.container.querySelector(
        "#chat-input"
      );

    const text =
      input.value.trim();

    const pendingAttachments =
      this.pendingAttachments || [];

    const editingAttachmentIds =
      this.editingAttachmentIds || [];

    if (
      !text &&
      pendingAttachments.length === 0 &&
      editingAttachmentIds.length === 0
    ) {
      return;
    }

    this.commandMenu.hide();

        if (this.editingMessageId) {
      const newAttachmentIds = [];

      for (const att of pendingAttachments) {
        await AttachmentStorage.saveAttachment(
          att
        );
        newAttachmentIds.push(
          att.id
        );
      }

      SessionService.updateMessageWithAttachments(
        this.editingMessageId,
        text || "[Attachment]",
        [
          ...editingAttachmentIds,
          ...newAttachmentIds
        ]
      );

      SessionService.removeMessagesAfter(
        this.editingMessageId
      );

      this.editingMessageId =
        null;

      this.editingAttachmentIds =
        [];

      this.pendingAttachments =
        [];

      this.renderAttachmentPreview();
      this.renderMessages();

      input.value = "";

      this.autoResizeTextarea(
        input
      );

      this.updateTokenCounter();

      await this.generateAssistantReply();
      return;
    }

    const attachmentIds = [];

    for (const att of pendingAttachments) {
      await AttachmentStorage.saveAttachment(
        att
      );
      attachmentIds.push(att.id);
    }

    const message =
      SessionService.addMessage(
        "user",
        text || "[Attachment]",
        attachmentIds
      );

    this.appendMessageObject(
      message,
      false,
      false,
      false
    );

    input.value = "";
    this.pendingAttachments = [];
    this.editingAttachmentIds =
      [];

    this.renderAttachmentPreview();
    this.autoResizeTextarea(
      input
    );
    this.updateTokenCounter();

    if (text.startsWith("/files ")) {
      const query =
        text.slice(7).trim();

      const results =
        SearchService.searchFiles(
          query
        );

      let content =
        `File results for: ${query}\n\n`;

      if (results.length) {
        results.forEach(file => {
          content +=
            `• ${file.name} (${file.path})\n`;
        });
      } else {
        content +=
          "No files found.";
      }

      this.appendMessageObject(
        {
          id:
            "msg_" +
            Date.now(),
          role:
            "assistant",
          content
        },
        true,
        true,
        true
      );

      return;
    }

    if (text.startsWith("/code ")) {
      const query =
        text.slice(6).trim();

      const results =
        await SearchService.searchCode(
          query
        );

      let content =
        `Code results for: ${query}\n\n`;

      if (results.length) {
        results.forEach(
          match => {
            content +=
              `• ${match.path}:${match.line} ${match.text}\n`;
          }
        );
      } else {
        content +=
          "No code matches found.";
      }

      this.appendMessageObject(
        {
          id:
            "msg_" +
            Date.now(),
          role:
            "assistant",
          content
        },
        true,
        true,
        true
      );

      return;
    }

    if (text.startsWith("/open ")) {
      const path =
        text.slice(6).trim();

      const result =
        SearchService.openFile(path);

      let content;

      if (result) {
        editorManager.switchFile(
          result.id
        );

        content =
          `Opened file:\n\n${result.name}`;
      } else {
        content =
          "File not found.";
      }

      this.appendMessageObject(
        {
          id:
            "msg_" +
            Date.now(),
          role:
            "assistant",
          content
        },
        true,
        true,
        true
      );

      return;
    }

        if (text.startsWith("/grep ")) {
      const query =
        text.slice(6).trim();

      const results =
        await SearchService.searchAllFiles(
          query
        );

      let content =
        `Global code results for: ${query}\n\n`;

      if (results.length) {
        results.forEach(
          match => {
            content +=
              `• ${match.path}:${match.line}\n${match.text}\n\n`;
          }
        );
      } else {
        content +=
          "No global matches found.";
      }

      this.appendMessageObject(
        {
          id:
            "msg_" +
            Date.now(),
          role:
            "assistant",
          content
        },
        true,
        true,
        true
      );

      return;
    }

    if (text.startsWith("/read ")) {
      const args =
        text.slice(6).trim();

      const parts =
        args.split(" ");

      const path =
        parts[0];

      const startLine =
        parts[1]
          ? parseInt(
              parts[1],
              10
            )
          : 1;

      const endLine =
        parts[2]
          ? parseInt(
              parts[2],
              10
            )
          : null;

      const result =
        await SearchService.readFile(
          path,
          startLine,
          endLine
        );

      let content;

      if (result) {
        content =
`File: ${result.file}

Lines ${result.startLine}-${result.endLine}

${result.content}`;
      } else {
        content =
          "Unable to read file.";
      }

      this.appendMessageObject(
        {
          id:
            "msg_" +
            Date.now(),
          role:
            "assistant",
          content
        },
        true,
        true,
        true
      );

      return;
    }

    const searchHints = [
      "where is ",
      "find ",
      "implemented",
      "defined",
      "locate"
    ];

    const isSearchQuery =
      searchHints.some(
        hint =>
          text
            .toLowerCase()
            .includes(hint)
      );

    if (isSearchQuery) {
      const words =
        text.match(
          /[A-Za-z_][A-Za-z0-9_]*/g
        ) || [];

      let symbol =
        words.find(
          word =>
            /[a-z][A-Z]/.test(
              word
            )
        );

      if (!symbol) {
        const ignored = [
          "where",
          "find",
          "implemented",
          "defined",
          "locate",
          "function",
          "method",
          "class",
          "is"
        ];

        symbol =
          words.find(
            word =>
              word.length >
                2 &&
              !ignored.includes(
                word.toLowerCase()
              )
          );
      }

      if (symbol) {
        const results =
          await SearchService.searchCode(
            symbol
          );

        let content =
          `${symbol} found in:\n\n`;

        if (results.length) {
          results
            .slice(0, 10)
            .forEach(
              match => {
                content +=
                  `• ${match.path}:${match.line}\n`;
              }
            );
        } else {
          content =
            `No results found for ${symbol}`;
        }

        this.appendMessageObject(
          {
            id:
              "msg_" +
              Date.now(),
            role:
              "assistant",
            content
          },
          true,
          true,
          true
        );

        return;
      }
    }

    await this.generateAssistantReply();
  }
};