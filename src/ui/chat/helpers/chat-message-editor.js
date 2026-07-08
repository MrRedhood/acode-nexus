import SessionService from "../../services/session-service.js";
import AttachmentStorage from "../../services/attachment-storage.js";

export default class ChatMessageEditor {
  static async handle(
    chat,
    text,
    input
  ) {
    if (
      !chat.editingMessageId
    ) {
      return false;
    }

    const pendingAttachments =
      chat.pendingAttachments ||
      [];

    const editingAttachmentIds =
      chat.editingAttachmentIds ||
      [];

    const newAttachmentIds =
      [];

    for (const att of pendingAttachments) {
      await AttachmentStorage.saveAttachment(
        att
      );

      newAttachmentIds.push(
        att.id
      );
    }

    SessionService.updateMessageWithAttachments(
      chat.editingMessageId,
      text || "[Attachment]",
      [
        ...editingAttachmentIds,
        ...newAttachmentIds
      ]
    );

    SessionService.removeMessagesAfter(
      chat.editingMessageId
    );

    chat.editingMessageId =
      null;

    chat.editingAttachmentIds =
      [];

    chat.pendingAttachments =
      [];

    chat.renderAttachmentPreview();

    chat.renderMessages();

    input.value = "";

    chat.autoResizeTextarea(
      input
    );

    chat.updateTokenCounter();

    await chat.generateAssistantReply();

    return true;
  }

  static startEditing(
    chat,
    message
  ) {
    const input =
      chat.container.querySelector(
        "#chat-input"
      );

    chat.editingMessageId =
      message.id;

    chat.editingAttachmentIds =
      [
        ...(message.attachmentIds ||
          [])
      ];

    input.value =
      message.content;

    input.focus();

    chat.renderAttachmentPreview();

    chat.autoResizeTextarea(
      input
    );

    chat.updateTokenCounter();
  }

  static cancelEditing(
    chat
  ) {
    chat.editingMessageId =
      null;

    chat.editingAttachmentIds =
      [];

    chat.pendingAttachments =
      [];

    const input =
      chat.container.querySelector(
        "#chat-input"
      );

    if (input) {
      input.value = "";

      chat.autoResizeTextarea(
        input
      );
    }

    chat.renderAttachmentPreview();

    chat.updateTokenCounter();
  }

  static isEditing(
    chat
  ) {
    return Boolean(
      chat.editingMessageId
    );
  }
}