import AIService from "../../services/ai-service.js";
import SessionService from "../../services/session-service.js";
import AttachmentStorage from "../../services/attachment-storage.js";

export default {
  stopGeneration() {
    if (this.activeController) {
      this.activeController.abort();
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

    let streamedText = "";

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

      await AIService.sendMessageStream(
        fullText => {
          streamedText =
            fullText;

          if (
            thinkingNode &&
            thinkingNode.parentNode
          ) {
            this.stopThinkingAnimation();
            thinkingNode.remove();

            this.appendMessageObject(
              assistantMessage,
              false,
              true,
              true
            );
          }

          const box =
            this.container.querySelector(
              "#chat-messages"
            );

          if (!box) {
            return;
          }

          const messages =
            box.querySelectorAll(
              ".nexus-ai"
            );

          const latest =
            messages[
              messages.length - 1
            ];

          if (!latest) {
            return;
          }

          const contentNodes =
            latest.childNodes;

          for (
            let i =
              contentNodes.length - 1;
            i >= 0;
            i--
          ) {
            const node =
              contentNodes[i];

            if (
              node.nodeType === 3
            ) {
              node.remove();
            }
          }

          const actions =
            latest.querySelector(
              ".nexus-msg-actions"
            );

          latest.innerHTML = `
            <strong>Nexus</strong><br>
            ${fullText.replace(
              /\n/g,
              "<br>"
            )}
          `;

          if (actions) {
            latest.appendChild(
              actions
            );
          }

          box.scrollTop =
            box.scrollHeight;
        },
        this.activeController.signal
      );

            assistantMessage.content =
        streamedText ||
        "No response returned.";

      SessionService.addExistingMessage(
        assistantMessage
      );
    } catch (error) {
      this.stopThinkingAnimation();

      if (
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
            `<strong>Error</strong><br>${error.message}`;
        } else {
          this.showToast(
            error.message ||
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

    if (
      !text &&
      this.pendingAttachments.length === 0 &&
      this.editingAttachmentIds.length === 0
    ) {
      return;
    }

    this.commandMenu.hide();

    /* EDIT MODE */
    if (this.editingMessageId) {
      const newAttachmentIds = [];

      for (const att of this
        .pendingAttachments) {
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
          ...this
            .editingAttachmentIds,
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

    /* NEW MESSAGE */
    const attachmentIds = [];

    for (const att of this
      .pendingAttachments) {
      await AttachmentStorage.saveAttachment(
        att
      );

      attachmentIds.push(
        att.id
      );
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