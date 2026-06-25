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
      console.log("SIDEBAR STEP 1");
      this.createFab();

      console.log("SIDEBAR STEP 2");
      this.createPanel();

      console.log("SIDEBAR STEP 3");
      window.addEventListener("resize", () => {
        this.updatePanelHeight();
      });

      console.log("SIDEBAR STEP 4");
      this.updatePanelHeight();

      console.log("SIDEBAR DONE");
    } catch (err) {
      console.error("Sidebar init error:", err);
      console.error("Message:", err?.message);
      console.error("Stack:", err?.stack);

      alert(
        "Sidebar crash:\n" +
        (err?.stack || err?.message || String(err))
      );
    }
  }

  createFab() {
    console.log("createFab");

    this.fab = document.createElement("button");
    this.fab.className = "nexus-fab";
    this.fab.textContent = "N";

    this.fab.addEventListener("click", () => {
      this.togglePanel();
    });

    document.body.appendChild(this.fab);
  }

  createPanel() {
    console.log("createPanel start");

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
    console.log("panel appended");

    this.drawer = document.createElement("div");
    this.drawer.className = "nexus-drawer";
    document.body.appendChild(this.drawer);
    console.log("drawer appended");

    console.log("creating settings");
    this.settingsView = new SettingsView(this.page);

    const chatRoot =
      this.panel.querySelector("#chat-root");

    if (!chatRoot) {
      throw new Error("chat-root not found");
    }

    console.log("creating chat view");
    this.chatView = new ChatView(chatRoot);

    console.log("creating sessions view");
    this.sessionsView = new SessionsView(
      this.drawer,
      () => {
        this.sessionsView.render();
        this.chatView.render();
        this.closeDrawer();
      }
    );

    console.log("render sessions");
    this.sessionsView.render();

    console.log("render chat");
    this.chatView.render();

    const drawerBtn =
      this.panel.querySelector("#drawer-btn");

    const settingsBtn =
      this.panel.querySelector("#settings-btn");

    const closeBtn =
      this.panel.querySelector("#nexus-close");

    if (!drawerBtn) {
      throw new Error("drawer-btn missing");
    }

    if (!settingsBtn) {
      throw new Error("settings-btn missing");
    }

    if (!closeBtn) {
      throw new Error("close-btn missing");
    }

    drawerBtn.addEventListener("click", () => {
      this.toggleDrawer();
    });

    settingsBtn.addEventListener("click", () => {
      this.settingsView.open();
    });

    closeBtn.addEventListener("click", () => {
      this.closePanel();
    });

    console.log("createPanel done");
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