function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default class DiffView {
  static render(
    originalText,
    modifiedText
  ) {
    return `
      <div class="nexus-diff-view">

        <div class="nexus-diff-section">
          <div class="nexus-diff-title">
            Original
          </div>

          <pre class="nexus-diff-code">${escapeHtml(
            originalText
          )}</pre>
        </div>

        <div class="nexus-diff-section">
          <div class="nexus-diff-title">
            Modified
          </div>

          <pre class="nexus-diff-code">${escapeHtml(
            modifiedText
          )}</pre>
        </div>

      </div>
    `;
  }
}