import SessionService from "../../services/session-service.js";

import ChatPipeline from "./helpers/chat-pipeline.js";
import ChatMessageEditor from "./helpers/chat-message-editor.js";

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
    ChatMessageEditor.startEditing(
      this,
      message
    );
  },

  async regenerateResponse() {
    if (this.isGenerating) {
      return;
    }

    SessionService.removeLastAssistantMessage();

    this.renderMessages();

    await ChatPipeline.reply(
      this
    );
  },

  async generateAssistantReply() {
    await ChatPipeline.reply(
      this
    );
  },

  async sendMessage() {
    await ChatPipeline.send(
      this
    );
  }
};