import AIService from "../services/ai-service.js";

export default class SettingsView {
  constructor() {
    this.modal = null;
  }

  open() {
    if (this.modal) return;

    this.modal = document.createElement("div");
    this.modal.className = "nexus-settings-overlay";

    const savedProvider =
      localStorage.getItem("nexus_provider") || "gemini";

    const savedKey =
      localStorage.getItem("nexus_api_key") || "";

    const savedModel =
      localStorage.getItem("nexus_model") || "";

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

    document.body.appendChild(this.modal);

    const providerEl =
      this.modal.querySelector("#settings-provider");

    const keyEl =
      this.modal.querySelector("#settings-key");

    const modelEl =
      this.modal.querySelector("#settings-model");

    providerEl.value = savedProvider;
    keyEl.value = savedKey;

    this.loadModels(savedProvider, savedModel);

    this.modal
      .querySelector("#settings-close")
      .addEventListener("click", () => this.close());

    providerEl.addEventListener("change", () => {
      this.loadModels(providerEl.value);
    });

    this.modal
      .querySelector("#settings-load-models")
      .addEventListener("click", async () => {
        await this.loadModels(providerEl.value);
      });

    this.modal
      .querySelector("#settings-save")
      .addEventListener("click", () => {
        localStorage.setItem(
          "nexus_provider",
          providerEl.value
        );

        localStorage.setItem(
          "nexus_api_key",
          keyEl.value
        );

        localStorage.setItem(
          "nexus_model",
          modelEl.value
        );

        alert("Settings saved");
        this.close();
      });
  }

  async loadModels(provider, selected = "") {
    const modelEl =
      this.modal.querySelector("#settings-model");

    modelEl.innerHTML = `<option>Loading...</option>`;

    try {
      const models = await AIService.getModels(provider);

      modelEl.innerHTML = "";

      models.forEach(model => {
        const option = document.createElement("option");
        option.value = model;
        option.textContent = model;

        if (model === selected) {
          option.selected = true;
        }

        modelEl.appendChild(option);
      });
    } catch (error) {
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