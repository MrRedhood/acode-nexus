import Sidebar from "../ui/sidebar.js";

export default class Nexus {
  constructor(baseUrl, page, options) {
    this.baseUrl = baseUrl;
    this.page = page;
    this.options = options;
    this.sidebar = null;
  }

  init() {
    this.sidebar = new Sidebar();
    this.sidebar.init();
  }

  destroy() {
    if (this.sidebar) {
      this.sidebar.destroy();
      this.sidebar = null;
    }
  }
}