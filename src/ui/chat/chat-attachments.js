import AttachmentStorage from "../../services/attachment-storage.js";

export default {
  async getAttachments(
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
  },

  openFilePicker(type) {
    const input =
      document.createElement(
        "input"
      );

    input.type = "file";

    if (type === "image") {
      input.accept = "image/*";
    }

    if (type === "txt") {
      input.accept =
        ".txt,text/plain";
    }

    if (type === "pdf") {
      input.accept =
        ".pdf,application/pdf";
    }

    if (type === "code") {
      input.accept =
        ".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.cs,.html,.css,.json,.xml,.md";
    }

    input.addEventListener(
      "change",
      async e => {
        const file =
          e.target.files?.[0];

        if (!file) return;

        await this.handleSelectedFile(
          file,
          type
        );
      }
    );

    input.click();
  },

  async handleSelectedFile(
    file,
    type
  ) {
    const attachment = {
      id:
        "att_" +
        Date.now() +
        "_" +
        Math.random()
          .toString(36)
          .slice(2),
      name: file.name,
      size: file.size,
      type
    };

    if (type === "image") {
      attachment.file = file;
    } else {
      attachment.content =
        await file.text();
    }

    this.pendingAttachments.push(
      attachment
    );

    this.renderAttachmentPreview();

    this.showToast(
      `${file.name} attached`
    );
  },

  async renderAttachmentPreview() {
    const preview =
      this.container.querySelector(
        "#attachment-preview"
      );

    if (!preview) return;

    const existingAttachments =
      await this.getAttachments(
        this.editingAttachmentIds
      );

    const hasExisting =
      existingAttachments.length >
      0;

    const hasPending =
      this.pendingAttachments
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

    const existingHtml =
      existingAttachments
        .map(att => {
          const icon =
            att.type === "image"
              ? "📷"
              : att.type ===
                "pdf"
              ? "📕"
              : "📎";

          return `
            <div class="nexus-attachment-chip">
              <span class="nexus-attachment-chip-text">
                ${icon}
                ${att.name}
                (${this.formatFileSize(att.size)})
              </span>

              <button
                class="nexus-attachment-remove-existing"
                data-id="${att.id}"
              >
                ×
              </button>
            </div>
          `;
        })
        .join("");

    const pendingHtml =
      this.pendingAttachments
        .map(att => {
          const icon =
            att.type === "image"
              ? "📷"
              : att.type ===
                "pdf"
              ? "📕"
              : "📎";

          return `
            <div class="nexus-attachment-chip">
              <span class="nexus-attachment-chip-text">
                ${icon}
                ${att.name}
                (${this.formatFileSize(att.size)})
              </span>

              <button
                class="nexus-attachment-remove"
                data-id="${att.id}"
              >
                ×
              </button>
            </div>
          `;
        })
        .join("");

    preview.innerHTML =
      existingHtml +
      pendingHtml;

    preview
      .querySelectorAll(
        ".nexus-attachment-remove"
      )
      .forEach(btn => {
        btn.addEventListener(
          "click",
          () => {
            this.removeAttachment(
              btn.dataset.id
            );
          }
        );
      });

    preview
      .querySelectorAll(
        ".nexus-attachment-remove-existing"
      )
      .forEach(btn => {
        btn.addEventListener(
          "click",
          () => {
            this.removeExistingAttachment(
              btn.dataset.id
            );
          }
        );
      });
  },

  async fillMessageAttachments(
    container,
    attachmentIds = []
  ) {
    if (
      !attachmentIds ||
      attachmentIds.length === 0
    ) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML =
      `<div class="nexus-message-attachment-chip">Loading...</div>`;

    const attachments =
      await this.getAttachments(
        attachmentIds
      );

    if (!attachments.length) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = `
      <div class="nexus-message-attachments">
        ${attachments
          .map(att => {
            const icon =
              att.type === "image"
                ? "📷"
                : att.type === "pdf"
                ? "📕"
                : "📎";

            return `
              <div class="nexus-message-attachment-chip">
                ${icon}
                ${att.name}
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  },

  removeAttachment(id) {
    this.pendingAttachments =
      this.pendingAttachments.filter(
        att => att.id !== id
      );

    this.renderAttachmentPreview();
  },

  removeExistingAttachment(
    id
  ) {
    this.editingAttachmentIds =
      this.editingAttachmentIds.filter(
        attId => attId !== id
      );

    this.renderAttachmentPreview();
  },

  formatFileSize(bytes) {
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
      ).toFixed(1) + " MB"
    );
  }
};