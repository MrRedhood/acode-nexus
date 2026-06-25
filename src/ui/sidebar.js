import ChatView from "./chat-view.js";
import SessionsView from "./sessions-view.js";
import SettingsView from "./settings-view.js";

export default class Sidebar {
  constructor(page) {
    console.log("Sidebar constructor page:", page);

    this.page = page;
    this.fab = null;
    this.panel = null;
    this.drawer = null;
    this.chatView = null;
    this.sessionsView = null;
    this.settingsView = null;
    this.isOpen = false;
  }

  init() {
    console.log("Sidebar init");

    try {
      this.createFab();
      this.createPanel();

      window.addEventListener("resize", () => {
        this.updatePanelHeight();
      });

      this.updatePanelHeight();
    } catch (err) {
      console.error("Sidebar init error:", err);
    }
  }

  createFab() {
    console.log("Creating FAB");

    this.fab = document.createElement("button");
    this.fab.className = "nexus-fab";
    this.fab.textContent = "N";

    this.fab.addEventListener("click", () => {
      console.log("FAB clicked");
      this.togglePanel();
    });

    document.body.appendChild(this.fab);
    console.log("FAB appended to body");
  }

  createPanel() {
    console.log("Creating panel");

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
    console.log("Panel appended to body");

    this.settingsView = new SettingsView();

    this.drawer =
      this.panel.querySelector("#sessions-drawer");

    const chatRoot =
      this.panel.querySelector("#chat-root");

    this.chatView = new ChatView(chatRoot);

    this.sessionsView = new SessionsView(
      this.drawer,
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
        console.log("Drawer clicked");

        if (this.drawer) {
          this.drawer.classList.toggle("open");
        }
      });

    this.panel
      .querySelector("#settings-btn")
      .addEventListener("click", () => {
        console.log("Settings clicked");
        this.settingsView.open();
      });

    this.panel
      .querySelector("#nexus-close")
      .addEventListener("click", () => {
        console.log("Close clicked");
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
    console.log("togglePanel:", this.isOpen);

    if (this.isOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  openPanel() {
    if (!this.panel || !this.fab) return;

    console.log("Opening panel");

    this.panel.classList.add("open");
    this.fab.style.display = "none";
    this.isOpen = true;
  }

  closePanel() {
    if (!this.panel || !this.fab) return;

    console.log("Closing panel");

    this.panel.classList.remove("open");

    if (this.drawer) {
      this.drawer.classList.remove("open");
    }

    this.fab.style.display = "block";
    this.isOpen = false;
  }

  destroy() {
    console.log("Destroy sidebar");

    if (this.fab) {
      this.fab.remove();
      this.fab = null;
    }

    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }
}