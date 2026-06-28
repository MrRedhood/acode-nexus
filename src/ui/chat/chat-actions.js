import AIService from "../../services/ai-service.js";
import SessionService from "../../services/session-service.js";
import AttachmentStorage from "../../services/attachment-storage.js";
import parseMarkdown from "../../utils/markdown.js";

export default {
  stopGeneration() {
    if (this.activeController) {
      this.activeController.abort();
    }

    if (this.fakeStreamTimer) {
      clearInterval(
        this.fakeStreamTimer
      );
      this.fakeStreamTimer =
        null;
    }

    this.isGenerating = false;

    const sendBtn =
      this.container.querySelector(
        "#send-btn"
      );

    if (sendBtn) {
      sendBtn.textContent =
        "↑";
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

  async fakeStreamResponse(
    assistantNode,
    fullText
  ) {
    return new Promise(resolve => {
      let index = 0;

      const chunkSize = 8;
      const intervalMs = 35;

      const escapeHtml = text =>
        (text || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

      this.fakeStreamTimer =
        setInterval(() => {
          if (
            !this.isGenerating
          ) {
            clearInterval(
              this.fakeStreamTimer
            );

            this.fakeStreamTimer =
              null;

            resolve(false);
            return;
          }

          index += chunkSize;

          const partial =
            fullText.slice(
              0,
              index
            );

          const actions =
            assistantNode.querySelector(
              ".nexus-msg-actions"
            );

          assistantNode.innerHTML = `
            <strong>Nexus</strong><br>
            ${escapeHtml(
              partial
            ).replace(
              /\n/g,
              "<br>"
            )}
          `;

          if (actions) {
            assistantNode.appendChild(
              actions
            );
          }

          const box =
            this.container.querySelector(
              "#chat-messages"
            );

          if (box) {
            box.scrollTop =
              box.scrollHeight;
          }

          if (
            index >=
            fullText.length
          ) {
            clearInterval(
              this.fakeStreamTimer
            );

            this.fakeStreamTimer =
              null;

            resolve(true);
          }
        }, intervalMs);
    });
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

      const response =
        await AIService.sendMessage(
          this.activeController.signal
        );

      assistantMessage.content =
        response ||
        "No response returned.";

      this.stopThinkingAnimation();

      if (
        thinkingNode &&
        thinkingNode.parentNode
      ) {
        thinkingNode.remove();
      }

      const assistantNode =
        this.appendMessageObject(
          {
            ...assistantMessage,
            content: ""
          },
          false,
          true,
          true
        );

      const completed =
        await this.fakeStreamResponse(
          assistantNode,
          assistantMessage.content
        );

      if (!completed) {
        const actions =
          assistantNode.querySelector(
            ".nexus-msg-actions"
          );

        assistantNode.innerHTML =
          `<strong>Nexus</strong><br>Generation stopped`;

        if (actions) {
          assistantNode.appendChild(
            actions
          );
        }

        return;
      }

      if (assistantNode) {
        const actions =
          assistantNode.querySelector(
            ".nexus-msg-actions"
          );

        assistantNode.innerHTML = `
          <strong>Nexus</strong><br>
          ${parseMarkdown(
            assistantMessage.content
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
      SessionService.createMessage(
        "user",
        text || "[Attachment]",
        attachmentIds
      );

    this.appendMessageObject(
      message,
      true,
      false,
      false
    );

    input.value = "";
    this.pendingAttachments = [];
    this.editingAttachmentIds = [];

    this.renderAttachmentPreview();
    this.autoResizeTextarea(
      input
    );
    this.updateTokenCounter();

    await this.generateAssistantReply();
  }
};