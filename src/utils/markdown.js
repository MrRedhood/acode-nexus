export default function parseMarkdown(text) {
  if (!text) return "";

  let html = text;

  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const codeBlocks = [];

  html = html.replace(
    /```([\w-]*)\n([\s\S]*?)```/g,
    (_, lang, code) => {
      const safeTextarea = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const block = `
        <div class="nexus-code-block">
          <div class="nexus-code-header">
            <div class="nexus-code-lang">
              ${(lang || "code").toUpperCase()}
            </div>

            <button class="nexus-code-copy">
              Copy
            </button>
          </div>

          <textarea
            class="nexus-hidden-code"
            style="display:none;"
          >${safeTextarea}</textarea>

          <pre><code>${code}</code></pre>
        </div>
      `;

      const token =
        "__CODE_BLOCK_" +
        codeBlocks.length +
        "__";

      codeBlocks.push(block);

      return token;
    }
  );

  html = html.replace(
    /`([^`]+)`/g,
    `<code class="nexus-inline-code">$1</code>`
  );

  html = html.replace(
    /\*\*(.*?)\*\*/g,
    `<strong>$1</strong>`
  );

  html = html.replace(
    /^### (.*)$/gm,
    `<h3>$1</h3>`
  );

  html = html.replace(
    /^## (.*)$/gm,
    `<h2>$1</h2>`
  );

  html = html.replace(
    /^# (.*)$/gm,
    `<h1>$1</h1>`
  );

  html = html.replace(/\n/g, "<br>");

  codeBlocks.forEach((block, index) => {
    html = html.replace(
      `__CODE_BLOCK_${index}__`,
      block
    );
  });

  return html;
}