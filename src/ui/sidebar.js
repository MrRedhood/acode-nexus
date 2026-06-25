import ChatView from "./chat-view.js";
import SessionsView from "./sessions-view.js";

export default class Sidebar {
  constructor() {
    this.fab = null;
    this.panel = null;
    this.chatView = null;
    this.sessionsView = null;
    this.isOpen = false;
  }

  init() {
    this.createFab();
    this.createPanel();
  }

  createFab() {
    this.fab = document.createElement("button");
    this.fab.className = "nexus-fab";
    this.fab.textContent = "N";

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
        <span class="nexus-title">Nexus</span>

        <div class="nexus-header-actions">
          <button id="settings-btn" class="nexus-icon-btn">⚙</button>
          <button id="nexus-close" class="nexus-close">×</button>
        </div>
      </div>

      <div class="nexus-layout">
        <div id="sessions-root" class="nexus-sessions-panel"></div>
        <div id="chat-root" class="nexus-chat-panel"></div>
      </div>
    `;

    document.body.appendChild(this.panel);

    this.panel
      .querySelector("#nexus-close")
      .addEventListener("click", () => this.closePanel());

    this.panel
      .querySelector("#settings-btn")
      .addEventListener("click", () => {
        alert("Settings modal coming next");
      });

    const sessionsRoot =
      this.panel.querySelector("#sessions-root");

    const chatRoot =
      this.panel.querySelector("#chat-root");

    this.chatView = new ChatView(chatRoot);

    this.sessionsView = new SessionsView(
      sessionsRoot,
      () => {
        this.sessionsView.render();
        this.chatView.render();
      }
    );

    this.sessionsView.render();
    this.chatView.render();
  }

  togglePanel() {
    this.isOpen ? this.closePanel() : this.openPanel();
  }

  openPanel() {
    this.panel.classList.add("open");
    this.fab.style.display = "none";
    this.isOpen = true;
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