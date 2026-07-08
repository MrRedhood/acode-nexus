import SessionService from "../../../services/session-service.js";
import AttachmentStorage from "../../../services/attachment-storage.js";

export default class AttachmentStorageHelper {
  static async getAttachments(
    attachmentIds = []
  ) {
    if (
      !attachmentIds ||
      attachmentIds.length === 0
    ) {
      return [];
    }

    const attachments = [];

    for (const id of attachmentIds) {
      let attachment =
        null;

      try {
        attachment =
          await AttachmentStorage.getAttachment(
            id
          );
      } catch (error) {
        console.error(
          "IndexedDB read failed:",
          error
        );
      }

      if (
        !attachment &&
        SessionService.getAttachments
      ) {
        const legacy =
          SessionService.getAttachments(
            [id]
          );

        attachment =
          legacy[0] || null;
      }

      if (attachment) {
        attachments.push(
          attachment
        );
      }
    }

    return attachments;
  }
}