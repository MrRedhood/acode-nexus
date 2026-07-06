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
    ${row.hiddenLines} unchanged ${
              row.hiddenLines === 1
                ? "line"
                : "lines"
            }
  </div>

  <div class="nexus-diff-collapse-line"></div>

</div>`;
          break;

        case "context":
          html += this.renderRow({
            line:
              row.oldLine,
            sign: "",
            html:
              row.html ??
              escapeHtml(
                row.text
              ),
            className: ""
          });
          break;

        case "remove":
          html += this.renderRow({
            line:
              row.oldLine,
            sign: "−",
            html:
              row.html ??
              escapeHtml(
                row.text
              ),
            className:
              "nexus-diff-removed"
          });
          break;

        case "add":
          html += this.renderRow({
            line:
              row.newLine,
            sign: "+",
            html:
              row.html ??
              escapeHtml(
                row.text
              ),
            className:
              "nexus-diff-added"
          });
          break;
      }
    }

    html += `</div>`;

    return html;
  }

  static renderRow({
    line,
    sign,
    html,
    className
  }) {
    return `
<div class="nexus-diff-row ${className}">

  <div class="nexus-diff-number">
    ${line ?? ""}
  </div>

  <div class="nexus-diff-sign">
    ${sign}
  </div>

  <div class="nexus-diff-code">
    <code>${html}</code>
  </div>

</div>`;
  }
}