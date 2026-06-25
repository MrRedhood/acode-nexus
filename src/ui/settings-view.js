import AIService from "../services/ai-service.js";
import StorageService from "../services/storage-service.js";

export default class SettingsView {
  constructor() {
    this.modal = null;
  }

  open() {
    if (this.modal) return;

    this.modal = document.createElement("div");
    this.modal.className = "nexus-settings-overlay";

    const savedProvider =
      StorageService.get("provider") || "gemini";

    const savedKey =
      StorageService.get("apiKey") || "";

    let savedModel =
      StorageService.get("model") || "";

    if (
      savedModel &&
      typeof savedModel === "object"
    ) {
      savedModel =
        savedModel.id ||
        savedModel.name ||
        "";

      StorageService.set("model", savedModel);
    }

    this.modal.innerHTML = `
      <div class="nexus-settings-modal">
        <div class="nexus-settings-header">
          <h2>Settings</h2>
          <button id="settings-close" class="nexus-close">×</button>
        </div>

        <label>Provider</label>
        <select id="settings-provider" class="nexus-input">
          <option value="gemini">Gemini</option>
          <option value="openrouter">OpenRouter</option>
          <option value="deepinfra">DeepInfra</option>
          <option value="litellm">LiteLLM</option>
        </select>

        <label>API Key</label>
        <input
          id="settings-key"
          class="nexus-input"
          type="password"
          placeholder="Enter API key"
        />

        <label>Model</label>
        <select id="settings-model" class="nexus-input"></select>

        <button id="settings-load-models" class="nexus-button">
          Load Models
        </button>

        <button id="settings-save" class="nexus-button">
          Save
        </button>
      </div>
    `;

    document.documentElement.appendChild(this.modal);

    const providerEl =
      this.modal.querySelector("#settings-provider");

    const keyEl =
      this.modal.querySelector("#settings-key");

    const modelEl =
      this.modal.querySelector("#settings-model");

    providerEl.value = savedProvider;
    keyEl.value = savedKey;

    this.loadModels(savedModel);

    this.modal
      .querySelector("#settings-close")
      .addEventListener("click", () => {
        this.close();
      });

    providerEl.addEventListener("change", () => {
      this.loadModels();
    });

    this.modal
      .querySelector("#settings-load-models")
      .addEventListener("click", async () => {
        await this.loadModels();
      });

    this.modal
      .querySelector("#settings-save")
      .addEventListener("click", () => {
        StorageService.set("provider", providerEl.value);
        StorageService.set("apiKey", keyEl.value);
        StorageService.set("model", modelEl.value);

        alert("Settings saved");
        this.close();
      });

    this.modal.addEventListener("click", e => {
      if (e.target === this.modal) {
        this.close();
      }
    });
  }

  async loadModels(selected = "") {
    if (!this.modal) return;

    const modelEl =
      this.modal.querySelector("#settings-model");

    modelEl.innerHTML =
      `<option>Loading...</option>`;

    try {
      const models =
        await AIService.getModels();

      modelEl.innerHTML = "";

      models.forEach(model => {
        const option =
          document.createElement("option");

        const value =
          typeof model === "string"
            ? model
            : model.id || model.name;

        const label =
          typeof model === "string"
            ? model
            : model.name || model.id;

        option.value = value;
        option.textContent = label;

        if (value === selected) {
          option.selected = true;
        }

        modelEl.appendChild(option);
      });
    } catch (error) {
      console.error(error);
      modelEl.innerHTML =
        `<option>Failed to load</option>`;
    }
  }

  close() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }
}