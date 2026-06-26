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
}

Object.assign(
  ChatView.prototype,
  ChatCore,
  ChatAttachments,
  ChatRenderer,
  ChatActions
);