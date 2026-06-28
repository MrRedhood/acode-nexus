import AttachmentMenu from "./menus/attachment-menu.js";
import CommandMenu from "./menus/command-menu.js";

import ChatCore from "./chat/chat-core.js";
import ChatAttachments from "./chat/chat-attachments.js";
import ChatRenderer from "./chat/chat-renderer.js";
import ChatActions from "./chat/chat-actions.js";

export default class ChatView {
  constructor(container) {
    this.container =
      container;

    this.activeController =
      null;

    this.isGenerating =
      false;

    this.editingMessageId =
      null;

    this.editingAttachmentIds =
      [];

    this.thinkingInterval =
      null;

    this.pendingAttachments =
      [];

    this.attachmentMenu =
      new AttachmentMenu(
        this
      );

    this.commandMenu =
      new CommandMenu(
        this
      );
  }

  async attachCurrentFile() {
    console.log(
      "[CHAT VIEW] attachCurrentFile entered"
    );

    try {
      if (
        !window.NexusBridge
      ) {
        this.showToast(
          "Nexus bridge unavailable"
        );
        return;
      }

      const file =
        await window.NexusBridge.getCurrentFile();

      if (
        !file ||
        !file.content
      ) {
        this.showToast(
          "No active file"
        );
        return;
      }

      const attachment = {
        id:
          "att_" +
          Date.now() +
          "_" +
          Math.random()
            .toString(36)
            .slice(2),

        name:
          file.name ||
          "current-file.txt",

        size:
          file.content.length,

        type:
          "current-file",

        mimeType:
          "text/plain",

        content:
          file.content
      };

      this.pendingAttachments.push(
        attachment
      );

      await this.renderAttachmentPreview();

      this.showToast(
        "Current file attached"
      );
    } catch (error) {
      console.error(error);

      this.showToast(
        "Current file attach failed"
      );
    }
  }
}

Object.assign(
  ChatView.prototype,
  ChatCore,
  ChatAttachments,
  ChatRenderer,
  ChatActions
);