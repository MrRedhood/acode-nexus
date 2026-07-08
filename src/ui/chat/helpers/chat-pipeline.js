import CommandService from "../../../services/command-service.js";

import ChatAI from "./chat-ai.js";
import ChatSearch from "./chat-search.js";
import ChatTaskRunner from "./chat-task-runner.js";
import ChatMessageEditor from "./chat-message-editor.js";

import SessionService from "../../../services/session-service.js";
import AttachmentStorage from "../../../services/attachment-storage.js";

export default class ChatPipeline {
  static async send(
    chat
  ) {
    if (
      chat.isGenerating
    ) {
      return;
    }

    const input =
      chat.container.querySelector(
        "#chat-input"
      );

    const text =
      input.value.trim();

    const pendingAttachments =
      chat.pendingAttachments ||
      [];

    const editingAttachmentIds =
      chat.editingAttachmentIds ||
      [];

    if (
      !text &&
      pendingAttachments.length === 0 &&
      editingAttachmentIds.length === 0
    ) {
      return;
    }

    chat.commandMenu.hide();

    if (
      await ChatMessageEditor.handle(
        chat,
        text,
        input
      )
    ) {
      return;
    }

    const attachmentIds =
      [];

    for (const att of pendingAttachments) {
      await AttachmentStorage.saveAttachment(
        att
      );

      attachmentIds.push(
        att.id
      );
    }

    const message =
      SessionService.addMessage(
        "user",
        text || "[Attachment]",
        attachmentIds
      );

    chat.appendMessageObject(
      message,
      false,
      false,
      false
    );

    input.value = "";

    chat.pendingAttachments =
      [];

    chat.editingAttachmentIds =
      [];

    chat.renderAttachmentPreview();

    chat.autoResizeTextarea(
      input
    );

    chat.updateTokenCounter();

    const command =
      await CommandService.execute(
        text
      );

    if (
      command.handled
    ) {
      chat.appendMessageObject(
        {
          id:
            "msg_" +
            Date.now(),
          role:
            "assistant",
          content:
            command.content
        },
        true,
        true,
        true
      );

      return;
    }

    if (
      await ChatSearch.execute(
        chat,
        text
      )
    ) {
      return;
    }

    await this.reply(
      chat
    );
  }

  static async reply(
    chat
  ) {
    const {
      assistantMessage
    } =
      await ChatAI.generate(
        chat,
        chat.activeController
          ?.signal
      );

    await ChatTaskRunner.execute(
      assistantMessage
    );

    SessionService.addExistingMessage(
      assistantMessage
    );
  }
}