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
        <button data-type="image">Upload Image</button>
        <button data-type="txt">Upload Text File</button>
        <button data-type="pdf">Upload PDF</button>
        <button data-type="code">Upload Code File</button>
        <button data-type="cancel">Cancel</button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", e => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    overlay
      .querySelectorAll("button")
      .forEach(btn => {
        btn.addEventListener(
          "click",
          () => {
            const type =
              btn.dataset.type;

            overlay.remove();

            if (type === "cancel") {
              return;
            }

            this.chatView.openFilePicker(
              type
            );
          }
        );
      });
  }
}