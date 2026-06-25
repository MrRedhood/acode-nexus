export default function parseMarkdown(text) {
  if (!text) return "";

  let html = text;

  // Escape HTML
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Store code blocks temporarily
  const codeBlocks = [];

  html = html.replace(
    /```([\w-]*)\n([\s\S]*?)```/g,
    (_, lang, code) => {
      const block = `
        <div class="nexus-code-block">
          <div class="nexus-code-lang">
            ${(lang || "code").toUpperCase()}
          </div>
          <pre><code>${code}</code></pre>
        </div>
      `;

      const token = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(block);
      return token;
    }
  );

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    `<code class="nexus-inline-code">$1</code>`
  );

  // Bold
  html = html.replace(
    /\*\*(.*?)\*\*/g,
    `<strong>$1</strong>`
  );

  // Headings
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

  // Normal line breaks ONLY for non-code text
  html = html.replace(/\n/g, "<br>");

  // Restore code blocks
  codeBlocks.forEach((block, index) => {
    html = html.replace(`__CODE_BLOCK_${index}__`, block);
  });

  return html;
}