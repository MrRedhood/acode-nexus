import Sidebar from "../ui/sidebar.js";

export default class Nexus {
  constructor(baseUrl, page, options) {
    this.baseUrl = baseUrl;
    this.page = page;
    this.options = options;
    this.sidebar = null;
  }

  async injectStyles() {
    const cssPath = `${this.baseUrl}style.css`;

    const res = await fetch(cssPath);
    const css = await res.text();

    const style = document.createElement("style");
    style.id = "nexus-style";
    style.textContent = css;

    document.head.appendChild(style);
  }

  async init() {
    await this.injectStyles();

    this.sidebar = new Sidebar();
    this.sidebar.init();
  }

  destroy() {
    if (this.sidebar) {
      this.sidebar.destroy();
    }

    const style = document.getElementById("nexus-style");
    if (style) style.remove();
  }
}