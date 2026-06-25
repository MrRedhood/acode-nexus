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
    const savedProvider =
      StorageService.get("provider") || "gemini";

    const savedApiKey =
      StorageService.get("apiKey") || "";

    this.panel = document.createElement("div");
    this.panel.className = "nexus-panel";

    this.panel.innerHTML = `
      <div class="nexus-header">
        <span class="nexus-title">Nexus</span>
        <button id="nexus-close" class="nexus-close">×</button>
      </div>

      <label class="nexus-label">Provider</label>
      <select id="provider-select" class="nexus-select">
        <option value="openrouter" ${
          savedProvider === "openrouter" ? "selected" : ""
        }>OpenRouter</option>

        <option value="gemini" ${
          savedProvider === "gemini" ? "selected" : ""
        }>Gemini</option>

        <option value="deepinfra" ${
          savedProvider === "deepinfra" ? "selected" : ""
        }>DeepInfra</option>
      </select>

      <label class="nexus-label">API Key</label>
      <input
        id="api-key"
        class="nexus-input"
        type="password"
        placeholder="Enter API key"
        value="${savedApiKey}"
      />

      <label class="nexus-label">Model</label>
      <select id="model-select" class="nexus-select">
        <option>Select provider first</option>
      </select>

      <button id="save-config" class="nexus-button">
        Load Models
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

    const modelSelect =
      this.panel.querySelector("#model-select");

    modelSelect.addEventListener("change", () => {
      StorageService.set("model", modelSelect.value);
    });

    const chatRoot = this.panel.querySelector("#chat-root");
    this.chatView = new ChatView(chatRoot);
    this.chatView.render();
  }

  async loadModels() {
    const provider =
      document.getElementById("provider-select").value;

    const apiKey =
      document.getElementById("api-key").value.trim();

    const modelSelect =
      document.getElementById("model-select");

    if (!apiKey) {
      alert("API key required");
      return;
    }

    StorageService.set("provider", provider);
    StorageService.set("apiKey", apiKey);

    modelSelect.innerHTML =
      "<option>Loading models...</option>";

    try {
      const models = await AIService.getModels();

      modelSelect.innerHTML = "";

      if (!models.length) {
        modelSelect.innerHTML =
          "<option>No models found</option>";
        return;
      }

      models.forEach(model => {
        const option = document.createElement("option");
        option.value = model.id;
        option.textContent = model.name;
        modelSelect.appendChild(option);
      });

      const savedModel = StorageService.get("model");

      if (savedModel) {
        modelSelect.value = savedModel;
      }
    } catch (error) {
      console.error(error);
      modelSelect.innerHTML =
        "<option>Failed to load</option>";
      alert(error.message);
    }
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