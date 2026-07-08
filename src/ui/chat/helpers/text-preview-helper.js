export default class TextPreviewHelper {
  static open(
    attachment
  ) {
    const old =
      document.querySelector(
        ".nexus-text-preview-overlay"
      );

    if (old) {
      old.remove();
    }

    const overlay =
      document.createElement(
        "div"
      );

    overlay.className =
      "nexus-text-preview-overlay";

    overlay.innerHTML = `
      <div class="nexus-text-preview-modal">
        <div class="nexus-text-preview-header">
          <div class="nexus-text-preview-title">
            ${attachment.name}
          </div>

          <button class="nexus-text-preview-close">
            ×
          </button>
        </div>

        <pre class="nexus-text-preview-content">${(
          attachment.content ||
          ""
        )
          .replace(
            /&/g,
            "&amp;"
          )
          .replace(
            /</g,
            "&lt;"
          )
          .replace(
            />/g,
            "&gt;"
          )}</pre>
      </div>
    `;

    overlay.addEventListener(
      "click",
      event => {
        if (
          event.target ===
            overlay ||
          event.target.classList.contains(
            "nexus-text-preview-close"
          )
        ) {
          overlay.remove();
        }
      }
    );

    document.body.appendChild(
      overlay
    );
  }

  static attach(
    root = document,
    attachments = []
  ) {
    root
      .querySelectorAll(
        ".nexus-file-card"
      )
      .forEach(card => {
        const id =
          card.dataset.id;

        const attachment =
          attachments.find(
            item =>
              item.id === id
          );

        if (
          !attachment
        ) {
          return;
        }

        card.onclick = () =>
          this.open(
            attachment
          );
      });
  }
}