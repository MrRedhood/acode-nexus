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

    Object.assign(this.fab.style, {
      position: "fixed",
      right: "20px",
      bottom: "24px",
      width: "56px",
      height: "56px",
      borderRadius: "50%",
      border: "none",
      background: "#4f46e5",
      color: "white",
      fontSize: "24px",
      zIndex: "999999"
    });

    this.fab.onclick = () => this.togglePanel();
    document.body.appendChild(this.fab);
  }

  createPanel() {
    this.panel = document.createElement("div");

    Object.assign(this.panel.style, {
      position: "fixed",
      top: "0",
      right: "-340px",
      width: "340px",
      height: "100%",
      background: "#1e1e1e",
      color: "white",
      zIndex: "999998",
      transition: "right 0.25s ease"
    });

    this.panel.innerHTML = `
      <div style="padding:16px;display:flex;justify-content:space-between;">
        <span>Acode Nexus</span>
        <button id="nexus-close">×</button>
      </div>
      <div style="padding:16px;">
        Nexus panel ready.
      </div>
    `;

    document.body.appendChild(this.panel);

    this.panel
      .querySelector("#nexus-close")
      .addEventListener("click", () => this.closePanel());
  }

  togglePanel() {
    this.isOpen ? this.closePanel() : this.openPanel();
  }

  openPanel() {
    this.panel.style.right = "0";
    this.isOpen = true;
  }

  closePanel() {
    this.panel.style.right = "-340px";
    this.isOpen = false;
  }

  destroy() {
    if (this.fab) this.fab.remove();
    if (this.panel) this.panel.remove();
  }
}