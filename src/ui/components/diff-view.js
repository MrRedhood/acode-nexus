function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default class DiffView {
  static render(diff) {
    let html =
      `<div class="nexus-diff-view">`;

    for (const row of diff) {
      switch (row.type) {
        case "collapsed":
          html += `
<div class="nexus-diff-collapsed">

  <div class="nexus-diff-collapse-line"></div>

  <div class="nexus-diff-collapse-text">
    ⋯ ${row.hiddenLines} unchanged ${
              row.hiddenLines === 1
                ? "line"
                : "lines"
            }
  </div>

  <div class="nexus-diff-collapse-line"></div>

</div>`;
          break;

        case "context":
          html += `
<div class="nexus-diff-row">

  <div class="nexus-diff-gutter">
    ${row.oldLine ?? ""}
  </div>

  <div class="nexus-diff-line">
    ${escapeHtml(row.text)}
  </div>

</div>`;
          break;

        case "remove":
          html += `
<div class="nexus-diff-row nexus-diff-removed">

  <div class="nexus-diff-gutter">
    ${row.oldLine ?? ""}
  </div>

  <div class="nexus-diff-prefix">
    −
  </div>

  <div class="nexus-diff-line">
    ${escapeHtml(row.text)}
  </div>

</div>`;
          break;

        case "add":
          html += `
<div class="nexus-diff-row nexus-diff-added">

  <div class="nexus-diff-gutter">
    ${row.newLine ?? ""}
  </div>

  <div class="nexus-diff-prefix">
    +
  </div>

  <div class="nexus-diff-line">
    ${escapeHtml(row.text)}
  </div>

</div>`;
          break;
      }
    }

    html += `</div>`;

    return html;
  }
}