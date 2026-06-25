import Sidebar from "../ui/sidebar.js";

export default class Nexus {
  constructor(baseUrl, page, options) {
    this.baseUrl = baseUrl;
    this.page = page;
    this.options = options;
    this.sidebar = null;
  }

  async injectStyles() {
    console.log("Inject styles start");

    const cssPath = `${this.baseUrl}style.css`;
    console.log("CSS path:", cssPath);

    const res = await fetch(cssPath);
    const css = await res.text();

    const style = document.createElement("style");
    style.id = "nexus-style";
    style.textContent = css;

    document.head.appendChild(style);

    console.log("Inject styles done");
  }

  async init() {
    try {
      console.log("Nexus init start");

      await this.injectStyles();

      console.log("Creating sidebar");

      this.sidebar = new Sidebar(this.page);
      this.sidebar.init();

      console.log("Sidebar initialized");
    } catch (err) {
      console.error("Nexus init crash:", err);
    }
  }

  destroy() {
    if (this.sidebar) {
      this.sidebar.destroy();
    }

    const style = document.getElementById("nexus-style");
    if (style) style.remove();
  }
}