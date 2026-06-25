import ChatView from "./chat-view.js";

export default class Sidebar {
  constructor() {
    this.fab = null;
    this.panel = null;
    this.chatView = null;
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
      bottom: "80px",
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
      right: "-90vw",
      width: "85vw",
      maxWidth: "360px",
      height: "100%",
      background: "#1e1e1e",
      color: "white",
      zIndex: "999998",
      transition: "right 0.25s ease",
      padding: "12px",
      boxSizing: "border-box",
      overflow: "auto"
    });

    this.panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:20px;font-weight:bold;">Acode Nexus</span>
        <button id="nexus-close">×</button>
      </div>

      <div style="margin-top:16px;">
        <label>Provider</label>
        <select id="provider-select" style="width:100%;margin-top:6px;">
          <option value="openrouter">OpenRouter</option>
          <option value="gemini">Gemini</option>
          <option value="deepinfra">DeepInfra</option>
        </select>
      </div>

      <div style="margin-top:12px;">
        <label>API Key</label>
        <input id="api-key"
          type="password"
          placeholder="Enter API key"
          style="width:100%;margin-top:6px;" />
      </div>

      <div style="margin-top:12px;">
        <label>Model</label>
        <select id="model-select" style="width:100%;margin-top:6px;">
          <option>Choose provider first</option>
        </select>
      </div>

      <button id="save-config"
        style="width:100%;margin-top:12px;">
        Save
      </button>

      <div id="chat-root"></div>
    `;

    document.body.appendChild(this.panel);

    this.panel
      .querySelector("#nexus-close")
      .addEventListener("click", () => this.closePanel());

    this.panel
      .querySelector("#save-config")
      .addEventListener("click", () => this.loadModels());

    const chatRoot = this.panel.querySelector("#chat-root");
    this.chatView = new ChatView(chatRoot);
    this.chatView.render();
  }

  loadModels() {
    const provider = document.getElementById("provider-select").value;
    const modelSelect = document.getElementById("model-select");

    modelSelect.innerHTML = "";

    let models = [];

    if (provider === "openrouter") {
      models = [
        "deepseek/deepseek-chat",
        "google/gemini-flash-1.5",
        "meta-llama/llama-3"
      ];
    } else if (provider === "gemini") {
      models = [
        "gemini-2.5-pro",
        "gemini-2.5-flash"
      ];
    } else {
      models = [
        "meta-llama/llama-3.3-70b"
      ];
    }

    models.forEach(model => {
      const option = document.createElement("option");
      option.value = model;
      option.textContent = model;
      modelSelect.appendChild(option);
    });
  }

  togglePanel() {
    this.isOpen ? this.closePanel() : this.openPanel();
  }

  openPanel() {
    this.panel.style.right = "0";
    this.isOpen = true;
  }

  closePanel() {
    this.panel.style.right = "-90vw";
    this.isOpen = false;
  }

  destroy() {
    if (this.fab) this.fab.remove();
    if (this.panel) this.panel.remove();
  }
}