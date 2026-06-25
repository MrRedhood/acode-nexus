export default function parseMarkdown(text) {
  if (!text) return "";

  let html = text;

  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(
    /```([\w-]*)\n([\s\S]*?)```/g,
    (_, lang, code) => `
      <pre class="nexus-code-block">
        <div class="nexus-code-lang">${lang || "code"}</div>
        <code>${code}</code>
      </pre>
    `
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

  return html;
}