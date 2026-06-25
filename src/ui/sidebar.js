export default class Sidebar {
  constructor() {
    this.fab = null;
    this.panel = null;
    this.isOpen = false;
  }

  init() {
    this.createFab();
    this.createPanel();
  }

  createFab() {
    this.fab = document.createElement("button");
    this.fab.textContent = "N";
    this.fab.className = "nexus-fab";

    this.fab.addEventListener("click", () => {
      this.togglePanel();
    });

    document.body.appendChild(this.fab);
  }

  createPanel() {
    this.panel = document.createElement("div");
    this.panel.className = "nexus-panel";

    this.panel.innerHTML = `
      <div class="nexus-header">
        <span>Acode Nexus</span>
        <button id="nexus-close-btn">×</button>
      </div>
      <div class="nexus-body">
        Nexus panel ready.
      </div>
    `;

    document.body.appendChild(this.panel);

    const closeBtn = this.panel.querySelector("#nexus-close-btn");
    closeBtn.addEventListener("click", () => {
      this.closePanel();
    });
  }

  togglePanel() {
    if (this.isOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  openPanel() {
    this.panel.classList.add("open");
    this.isOpen = true;
  }

  closePanel() {
    this.panel.classList.remove("open");
    this.isOpen = false;
  }

  destroy() {
    if (this.fab) this.fab.remove();
    if (this.panel) this.panel.remove();
  }
}