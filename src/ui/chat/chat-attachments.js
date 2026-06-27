import SessionService from "../../services/session-service.js";
import AttachmentStorage from "../../services/attachment-storage.js";

export default {
  async getAttachmentsHybrid(
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
      let attachment = null;

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

      if (!attachment) {
        if (
          SessionService.getAttachments
        ) {
          const legacy =
            SessionService.getAttachments(
              [id]
            );

          attachment =
            legacy[0] || null;
        }
      }

      if (attachment) {
        attachments.push(
          attachment
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

  fileToBase64(file) {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload =
          () => {
            const result =
              reader.result;

            const base64 =
              result.split(",")[1];

            resolve(base64);
          };

        reader.onerror =
          reject;

        reader.readAsDataURL(
          file
        );
      }
    );
  },

  getMimeType(file, type) {
    if (type === "pdf") {
      return "application/pdf";
    }

    if (type === "image") {
      return (
        file.type ||
        "image/png"
      );
    }

    return "text/plain";
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
      type,
      mimeType:
        file.type ||
        this.getMimeType(
          file,
          type
        )
    };

    if (
      type === "image" ||
      type === "pdf"
    ) {
      attachment.data =
        await this.fileToBase64(
          file
        );
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

  renderAttachmentCard(
    att,
    removable = false,
    existing = false
  ) {
    const removeClass = existing
      ? "nexus-attachment-remove-existing"
      : "nexus-attachment-remove";

    const removeButton = removable
      ? `
        <button
          class="${removeClass}"
          data-id="${att.id}"
        >
          ×
        </button>
      `
      : "";

    if (att.type === "image") {
      const imageSrc =
        att.data
          ? `data:${att.mimeType};base64,${att.data}`
          : "";

      return `
        <div class="nexus-attachment-card nexus-image-card">
          ${
            imageSrc
              ? `<img src="${imageSrc}" class="nexus-attachment-thumb">`
              : `<div class="nexus-attachment-thumb-placeholder">📷</div>`
          }

          <div class="nexus-attachment-meta">
            <div>${att.name}</div>
            <small>${this.formatFileSize(att.size)}</small>
          </div>

          ${removeButton}
        </div>
      `;
    }

    if (att.type === "pdf") {
      return `
        <div class="nexus-attachment-card nexus-pdf-card">
          <div class="nexus-attachment-icon">📕</div>

          <div class="nexus-attachment-meta">
            <div>${att.name}</div>
            <small>${this.formatFileSize(att.size)}</small>
          </div>

          ${removeButton}
        </div>
      `;
    }

    return `
      <div class="nexus-attachment-card nexus-file-card">
        <div class="nexus-attachment-icon">📎</div>

        <div class="nexus-attachment-meta">
          <div>${att.name}</div>
          <small>${this.formatFileSize(att.size)}</small>
        </div>

        ${removeButton}
      </div>
    `;
  },

  async renderAttachmentPreview() {
    const preview =
      this.container.querySelector(
        "#attachment-preview"
      );

    if (!preview) return;

    const existingAttachments =
      await this.getAttachmentsHybrid(
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
        .map(att =>
          this.renderAttachmentCard(
            att,
            true,
            true
          )
        )
        .join("");

    const pendingHtml =
      this.pendingAttachments
        .map(att =>
          this.renderAttachmentCard(
            att,
            true,
            false
          )
        )
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
      await this.getAttachmentsHybrid(
        attachmentIds
      );

    if (!attachments.length) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = `
      <div class="nexus-message-attachments">
        ${attachments
          .map(att =>
            this.renderAttachmentCard(
              att,
              false,
              false
            )
          )
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