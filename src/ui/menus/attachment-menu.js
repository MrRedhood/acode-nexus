export default class AttachmentMenu {
  constructor(chatView) {
    this.chatView = chatView;
  }

  open() {
    const overlay =
      document.createElement("div");

    overlay.className =
      "nexus-action-overlay";

    overlay.innerHTML = `
      <div class="nexus-action-sheet">
        <button data-type="txt">
          Attach Text File
        </button>

        <button data-type="code">
          Attach Code File
        </button>

        <button data-type="clipboard">
          Attach Clipboard
        </button>

        <button data-type="current-file">
          Attach Current File
        </button>

        <button data-type="cancel">
          Cancel
        </button>
      </div>
    `;

    document.body.appendChild(
      overlay
    );

    overlay.addEventListener(
      "click",
      e => {
        if (e.target === overlay) {
          overlay.remove();
        }
      }
    );

    overlay
      .querySelectorAll("button")
      .forEach(btn => {
        btn.addEventListener(
          "click",
          async () => {
            const type =
              btn.dataset.type;

            overlay.remove();

            if (
              type === "cancel"
            ) {
              return;
            }

            try {
              if (
                type ===
                "clipboard"
              ) {
                if (
                  this.chatView
                    .attachClipboard
                ) {
                  await this.chatView.attachClipboard();
                } else {
                  this.chatView.showToast(
                    "Clipboard not implemented"
                  );
                }

                return;
              }

              if (
                type ===
                "current-file"
              ) {
                if (
                  this.chatView
                    .attachCurrentFile
                ) {
                  await this.chatView.attachCurrentFile();
                } else {
                  this.chatView.showToast(
                    "Current file not implemented"
                  );
                }

                return;
              }

              this.chatView.openFilePicker(
                type
              );
            } catch (error) {
              console.error(
                error
              );

              this.chatView.showToast(
                "Attachment failed"
              );
            }
          }
        );
      });
  }
}