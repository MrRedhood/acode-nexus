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
    const oldLines =
      String(originalText || "")
        .split("\n");

    const newLines =
      String(modifiedText || "")
        .split("\n");

    const maxLines =
      Math.max(
        oldLines.length,
        newLines.length
      );

    let html =
      `<div class="nexus-diff-view">`;

    for (
      let i = 0;
      i < maxLines;
      i++
    ) {
      const oldLine =
        oldLines[i];

      const newLine =
        newLines[i];

      if (
        oldLine === newLine
      ) {
        html += `
<div class="nexus-diff-row">

  <div class="nexus-diff-gutter">
    ${i + 1}
  </div>

  <div class="nexus-diff-line">
    ${escapeHtml(
      oldLine ?? ""
    )}
  </div>

</div>`;
        continue;
      }

      if (
        oldLine !== undefined
      ) {
        html += `
<div class="nexus-diff-row nexus-diff-removed">

  <div class="nexus-diff-gutter">
    ${i + 1}
  </div>

  <div class="nexus-diff-prefix">
    −
  </div>

  <div class="nexus-diff-line">
    ${escapeHtml(
      oldLine
    )}
  </div>

</div>`;
      }

      if (
        newLine !== undefined
      ) {
        html += `
<div class="nexus-diff-row nexus-diff-added">

  <div class="nexus-diff-gutter">
    ${i + 1}
  </div>

  <div class="nexus-diff-prefix">
    +
  </div>

  <div class="nexus-diff-line">
    ${escapeHtml(
      newLine
    )}
  </div>

</div>`;
      }
    }

    html += `</div>`;

    return html;
  }
}