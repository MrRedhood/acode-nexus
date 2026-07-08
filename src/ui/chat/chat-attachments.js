import AttachmentStorageHelper from "./helpers/attachment-storage-helper.js";
import TextPreviewHelper from "./helpers/text-preview-helper.js";
import AttachmentPickerHelper from "./helpers/attachment-picker-helper.js";
import AttachmentRenderer from "./helpers/attachment-renderer.js";

export default {
  async getAttachmentsHybrid(
    attachmentIds = []
  ) {
    return AttachmentStorageHelper.getAttachments(
      attachmentIds
    );
  },

  openTextPreview(
    attachment
  ) {
    return TextPreviewHelper.open(
      attachment
    );
  },

  attachPreviewListeners(
    root = document,
    attachments = []
  ) {
    return TextPreviewHelper.attach(
      root,
      attachments
    );
  },

  openFilePicker(type) {
    return AttachmentPickerHelper.open(
      this,
      type
    );
  },

  fileToText(file) {
    return AttachmentPickerHelper.fileToText(
      file
    );
  },

  async handleSelectedFile(
    file,
    type
  ) {
    return AttachmentPickerHelper.handleFile(
      this,
      file,
      type
    );
  },

  renderAttachmentCard(
    attachment,
    removable = false,
    existing = false
  ) {
    return AttachmentRenderer.renderCard(
      attachment,
      removable,
      existing
    );
  },

  async renderAttachmentPreview() {
    return AttachmentRenderer.renderPreview(
      this
    );
  },

  async fillMessageAttachments(
    container,
    attachmentIds = []
  ) {
    return AttachmentRenderer.fillMessage(
      this,
      container,
      attachmentIds
    );
  },

  removeAttachment(id) {
    this.pendingAttachments =
      this.pendingAttachments.filter(
        attachment =>
          attachment.id !== id
      );

    this.renderAttachmentPreview();
  },

  removeExistingAttachment(
    id
  ) {
    this.editingAttachmentIds =
      this.editingAttachmentIds.filter(
        attachmentId =>
          attachmentId !== id
      );

    this.renderAttachmentPreview();
  },

  formatFileSize(
    bytes
  ) {
    return AttachmentRenderer.formatFileSize(
      bytes
    );
  }
};