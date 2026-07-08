import AttachmentStorageHelper from "./attachment-storage-helper.js";
import TextPreviewHelper from "./text-preview-helper.js";

export default class AttachmentRenderer {
  static formatFileSize(
    bytes
  ) {
    if (bytes < 1024) {
      return bytes + " B";
    }

    if (
      bytes <
      1024 * 1024
    ) {
      return (
        (
          bytes / 1024
        ).toFixed(1) +
        " KB"
      );
    }

    return (
      (
        bytes /
        (1024 * 1024)
      ).toFixed(1) +
      " MB"
    );
  }

  static renderCard(
    attachment,
    removable = false,
    existing = false
  ) {
    const removeClass =
      existing
        ? "nexus-attachment-remove-existing"
        : "nexus-attachment-remove";

    const removeButton =
      removable
        ? `
<button
  class="${removeClass}"
  data-id="${attachment.id}"
>
  ×
</button>
`
        : "";

    return `
<div
  class="nexus-attachment-card nexus-file-card"
  data-id="${attachment.id}"
>
  <div class="nexus-attachment-icon">
    📎
  </div>

  <div class="nexus-attachment-meta">
    <div>${attachment.name}</div>

    <small>
      ${this.formatFileSize(
        attachment.size
      )}
    </small>
  </div>

  ${removeButton}
</div>
`;
  }

  static async renderPreview(
    chat
  ) {
    const preview =
      chat.container.querySelector(
        "#attachment-preview"
      );

    if (!preview) {
      return;
    }

    const existingAttachments =
      await AttachmentStorageHelper.getAttachments(
        chat.editingAttachmentIds
      );

    const hasExisting =
      existingAttachments.length >
      0;

    const hasPending =
      chat.pendingAttachments
        .length > 0;

    if (
      !hasExisting &&
      !hasPending
    ) {
      preview.innerHTML = "";
      preview.style.display =
        "none";
      return;
    }

    preview.style.display =
      "flex";

    const allAttachments = [
      ...existingAttachments,
      ...chat.pendingAttachments
    ];

    preview.innerHTML =
      existingAttachments
        .map(att =>
          this.renderCard(
            att,
            true,
            true
          )
        )
        .join("") +
      chat.pendingAttachments
        .map(att =>
          this.renderCard(
            att,
            true,
            false
          )
        )
        .join("");

    TextPreviewHelper.attach(
      preview,
      allAttachments
    );

    preview
      .querySelectorAll(
        ".nexus-attachment-remove"
      )
      .forEach(btn => {
        btn.onclick =
          event => {
            event.stopPropagation();

            chat.removeAttachment(
              btn.dataset.id
            );
          };
      });

    preview
      .querySelectorAll(
        ".nexus-attachment-remove-existing"
      )
      .forEach(btn => {
        btn.onclick =
          event => {
            event.stopPropagation();

            chat.removeExistingAttachment(
              btn.dataset.id
            );
          };
      });
  }

  static async fillMessage(
    chat,
    container,
    attachmentIds = []
  ) {
    if (
      !attachmentIds ||
      attachmentIds.length === 0
    ) {
      container.innerHTML =
        "";

      return;
    }

    container.innerHTML =
      `
<div class="nexus-message-attachment-chip">
Loading...
</div>
`;

    const attachments =
      await AttachmentStorageHelper.getAttachments(
        attachmentIds
      );

    if (
      !attachments.length
    ) {
      container.innerHTML =
        "";

      return;
    }

    container.innerHTML =
      `
<div class="nexus-message-attachments">
${attachments
  .map(att =>
    this.renderCard(
      att,
      false,
      false
    )
  )
  .join("")}
</div>
`;

    TextPreviewHelper.attach(
      container,
      attachments
    );
  }
}