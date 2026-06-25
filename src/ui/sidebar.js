export default class Sidebar {
  constructor() {
    this.container = null;
  }

  init() {
    this.container = document.createElement("div");

    this.container.innerText = "Acode Nexus Loaded";
    this.container.style.position = "fixed";
    this.container.style.bottom = "20px";
    this.container.style.right = "20px";
    this.container.style.padding = "12px 16px";
    this.container.style.background = "#222";
    this.container.style.color = "#fff";
    this.container.style.borderRadius = "12px";
    this.container.style.zIndex = "99999";

    document.body.appendChild(this.container);
  }

  destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}