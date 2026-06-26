import AIService from "../../services/ai-service.js";
import SessionService from "../../services/session-service.js";

export default {
  stopGeneration() {
    if (
      this.activeController
    ) {
      this.activeController.abort();
    }
  },

  startEditMessage(
    message
  ) {
    const input =
      this.container.querySelector(
        "#chat-input"
      );

    this.editingMessageId =
      message.id;

    this.editingAttachmentIds =
      [
        ...(message
          .attachmentIds || [])
      ];

    input.value =
      message.content;

    input.focus();

    this.renderAttachmentPreview();

    this.autoResizeTextarea(
      input
    );

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
          content:
            "Thinking..."
        },
        false,
        false,
        true
      );

    this.startThinkingAnimation(
      thinkingNode
    );

    try {
      const response =
        await AIService.sendMessage(
          this.activeController
            .signal
        );

      this.stopThinkingAnimation();

      thinkingNode.remove();

      this.appendMessageObject(
        {
          id:
            "msg_" +
            Date.now() +
            "_" +
            Math.random()
              .toString(36)
              .slice(2),
          role: "assistant",
          content:
            response
        },
        true,
        true,
        true
      );
    } catch (error) {
      this.stopThinkingAnimation();

      if (
        error.name ===
        "AbortError"
      ) {
        thinkingNode.innerHTML =
          `<strong>Nexus</strong><br>Generation stopped`;
      } else {
        thinkingNode.innerHTML =
          `<strong>Error</strong><br>${error.message}`;
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
    if (
      this.isGenerating
    ) {
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
      this.pendingAttachments
        .length === 0 &&
      this
        .editingAttachmentIds
        .length === 0
    ) {
      return;
    }

    this.commandMenu.hide();

    if (
      this.editingMessageId
    ) {
      const newAttachmentIds =
        [];

      this.pendingAttachments.forEach(
        att => {
          SessionService.addAttachment(
            att
          );

          newAttachmentIds.push(
            att.id
          );
        }
      );

      SessionService.updateMessageWithAttachments(
        this.editingMessageId,
        text ||
          "[Attachment]",
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

    const attachmentIds =
      [];

    this.pendingAttachments.forEach(
      att => {
        SessionService.addAttachment(
          att
        );

        attachmentIds.push(
          att.id
        );
      }
    );

    const message =
      SessionService.createMessage(
        "user",
        text ||
          "[Attachment]",
        attachmentIds
      );

    this.appendMessageObject(
      message,
      true,
      false,
      false
    );

    input.value = "";

    this.pendingAttachments =
      [];

    this.editingAttachmentIds =
      [];

    this.renderAttachmentPreview();

    this.autoResizeTextarea(
      input
    );

    this.updateTokenCounter();

    await this.generateAssistantReply();
  }
};