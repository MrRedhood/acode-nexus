import Sidebar from "../ui/sidebar.js";

export default class Nexus {
  constructor(baseUrl, page, options) {
    this.baseUrl = baseUrl;
    this.page = page;
    this.options = options;
    this.sidebar = null;
  }

  init() {
    console.log("Acode Nexus initialized");
    this.sidebar = new Sidebar();
    this.sidebar.init();
  }

  destroy() {
    if (this.sidebar) {
      this.sidebar.destroy();
      this.sidebar = null;
    }

    console.log("Acode Nexus destroyed");
  }
}