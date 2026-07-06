import DiffService from "../services/diff-service.js";
import DiffView from "./components/diff-view.js";

export default class DiffPreviewModal {
  static show({
    file,
    original,
    modified
  }) {
    return new Promise(resolve => {
      const diff =
        DiffService.build(
          original,
          modified
        );

      const overlay =
        document.createElement("div");

      overlay.className =
        "nexus-action-overlay";

      overlay.innerHTML = `
        <div class="nexus-diff-modal">

          <div class="nexus-diff-header">
            <h3>Patch Preview</h3>

            <div class="nexus-diff-file">
              ${file}
            </div>
          </div>

          <div class="nexus-diff-body">
            ${DiffView.render(diff)}
          </div>

          <div class="nexus-diff-footer">

            <button
              class="nexus-diff-cancel"
            >
              Cancel
            </button>

            <button
              class="nexus-diff-apply"
            >
              Apply
            </button>

          </div>

        </div>
      `;

      document.body.appendChild(
        overlay
      );

      const close = accepted => {
        overlay.remove();
        resolve(accepted);
      };

      overlay.addEventListener(
        "click",
        event => {
          if (
            event.target ===
            overlay
          ) {
            close(false);
          }
        }
      );

      overlay
        .querySelector(
          ".nexus-diff-cancel"
        )
        .addEventListener(
          "click",
          () => close(false)
        );

      overlay
        .querySelector(
          ".nexus-diff-apply"
        )
        .addEventListener(
          "click",
          () => close(true)
        );
    });
  }
}