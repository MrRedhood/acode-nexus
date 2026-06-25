import ChatView from "./chat-view.js";
import SessionsView from "./sessions-view.js";
import SettingsView from "./settings-view.js";

export default class Sidebar {
  constructor() {
    this.fab = null;
    this.panel = null;
    this.chatView = null;
    this.sessionsView = null;
    this.settingsView = null;
    this.isOpen = false;
  }

  init() {
    this.createFab();
    this.createPanel();

    window.addEventListener("resize", () => {
      this.updatePanelHeight();
    });

    this.updatePanelHeight();
  }

  createFab() {
    this.fab = document.createElement("button");
    this.fab.className = "nexus-fab";
    this.fab.textContent = "N";

    this.fab.onclick = () => this.togglePanel();

    document.body.appendChild(this.fab);
  }

  createPanel() {
    this.panel = document.createElement("div");
    this.panel.className = "nexus-panel";

    this.panel.innerHTML = `
      <div class="nexus-header">
        <div class="nexus-left-actions">
          <button id="drawer-btn" class="nexus-icon-btn">☰</button>
          <span class="nexus-title">Nexus</span>
        </div>

        <div class="nexus-header-actions">
          <button id="settings-btn" class="nexus-icon-btn">⚙</button>
          <button id="nexus-close" class="nexus-close">×</button>
        </div>
      </div>

      <div id="sessions-drawer" class="nexus-drawer"></div>

      <div id="chat-root" class="nexus-chat-full"></div>
    `;

    document.body.appendChild(this.panel);

    this.settingsView = new SettingsView();

    const drawer =
      this.panel.querySelector("#sessions-drawer");

    const chatRoot =
      this.panel.querySelector("#chat-root");

    this.chatView = new ChatView(chatRoot);

    this.sessionsView = new SessionsView(
      drawer,
      () => {
        this.sessionsView.render();
        this.chatView.render();
      }
    );

    this.sessionsView.render();
    this.chatView.render();

    this.panel
      .querySelector("#drawer-btn")
      .addEventListener("click", () => {
        drawer.classList.toggle("open");
      });

    this.panel
      .querySelector("#settings-btn")
      .addEventListener("click", () => {
        this.settingsView.open();
      });

    this.panel
      .querySelector("#nexus-close")
      .addEventListener("click", () => {
        this.closePanel();
      });
  }

  updatePanelHeight() {
    if (!this.panel) return;

    this.panel.style.height =
      window.innerHeight + "px";

    this.panel.style.maxHeight =
      window.innerHeight + "px";
  }

  togglePanel() {
    this.isOpen
      ? this.closePanel()
      : this.openPanel();
  }

  openPanel() {
    this.panel.classList.add("open");
    this.fab.style.display = "none";
    this.isOpen = true;
    this.updatePanelHeight();
  }

  closePanel() {
    this.panel.classList.remove("open");
    this.fab.style.display = "block";
    this.isOpen = false;
  }

  destroy() {
    if (this.fab) this.fab.remove();
    if (this.panel) this.panel.remove();
  }
}