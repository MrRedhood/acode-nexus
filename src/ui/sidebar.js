import ChatView from "./chat-view.js";
import SessionsView from "./sessions-view.js";
import SettingsView from "./settings-view.js";

export default class Sidebar {
  constructor(page) {
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
        <div class="nexus-left-actions">
          <button id="drawer-btn" class="nexus-icon-btn">☰</button>
          <span class="nexus-title">Nexus</span>
        </div>

        <div class="nexus-header-actions">
          <button id="settings-btn" class="nexus-icon-btn">⚙</button>
          <button id="nexus-close" class="nexus-close">×</button>
        </div>
      </div>

      <div id="chat-root" class="nexus-chat-full"></div>
    `;

    document.body.appendChild(this.panel);

    /* CREATE DRAWER SEPARATELY */
    this.drawer = document.createElement("div");
    this.drawer.className = "nexus-drawer";
    document.body.appendChild(this.drawer);

    this.settingsView = new SettingsView(this.page);

    const chatRoot =
      this.panel.querySelector("#chat-root");

    this.chatView = new ChatView(chatRoot);

    this.sessionsView = new SessionsView(
      this.drawer,
      () => {
        this.sessionsView.render();
        this.chatView.render();
        this.closeDrawer();
      }
    );

    this.sessionsView.render();
    this.chatView.render();

    this.panel
      .querySelector("#drawer-btn")
      .addEventListener("click", () => {
        this.toggleDrawer();
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
    if (this.panel) {
      this.panel.style.height =
        window.innerHeight + "px";
    }

    if (this.drawer) {
      this.drawer.style.height =
        window.innerHeight + "px";
    }
  }

  toggleDrawer() {
    if (!this.drawer) return;

    if (this.drawer.classList.contains("open")) {
      this.closeDrawer();
    } else {
      this.drawer.classList.add("open");
    }
  }

  closeDrawer() {
    if (this.drawer) {
      this.drawer.classList.remove("open");
    }
  }

  togglePanel() {
    if (this.isOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  openPanel() {
    if (!this.panel || !this.fab) return;

    this.panel.classList.add("open");
    this.fab.style.display = "none";
    this.isOpen = true;
  }

  closePanel() {
    if (!this.panel || !this.fab) return;

    this.panel.classList.remove("open");
    this.closeDrawer();

    this.fab.style.display = "block";
    this.isOpen = false;
  }

  destroy() {
    if (this.fab) {
      this.fab.remove();
      this.fab = null;
    }

    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }

    if (this.drawer) {
      this.drawer.remove();
      this.drawer = null;
    }
  }
}