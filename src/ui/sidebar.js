import ChatView from "./chat-view.js";
import StorageService from "../services/storage-service.js";
import AIService from "../services/ai-service.js";

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
        <button id="nexus-close" class="nexus-close">×</button>
      </div>

      <label class="nexus-label">Provider</label>
      <select id="provider-select" class="nexus-select">
        <option value="openrouter">OpenRouter</option>
        <option value="gemini">Gemini</option>
        <option value="deepinfra">DeepInfra</option>
      </select>

      <label class="nexus-label">API Key</label>
      <input
        id="api-key"
        class="nexus-input"
        type="password"
        placeholder="Enter API key"
      />

      <label class="nexus-label">Model</label>
      <select id="model-select" class="nexus-select">
        <option>Select provider first</option>
      </select>

      <button id="save-config" class="nexus-button">
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