import AttachmentStorage from "./attachment-storage.js";

const MAX_ATTACHMENT_CHARS =
  120000;

const MAX_TOTAL_ATTACHMENT_CHARS =
  250000;

export default class AttachmentService {
  static MAX_TOTAL_ATTACHMENT_CHARS =
    MAX_TOTAL_ATTACHMENT_CHARS;

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
}