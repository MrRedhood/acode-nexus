import AIService from "../services/ai-service.js";
import StorageService from "../services/storage-service.js";
import ContextService from "../services/context-service.js";

export default class SettingsView {
  constructor() {
    this.modal = null;
  }

  open() {
    if (this.modal) {
      return;
    }

    this.modal =
      document.createElement("div");

    this.modal.className =
      "nexus-settings-overlay";

    const savedProvider =
      StorageService.get(
        "provider"
      ) || "gemini";

    const savedKey =
      StorageService.get(
        "apiKey"
      ) || "";

    let savedModel =
      StorageService.get(
        "model"
      ) || "";

    if (
      savedModel &&
      typeof savedModel ===
        "object"
    ) {
      savedModel =
        savedModel.id ||
        savedModel.name ||
        "";

      StorageService.set(
        "model",
        savedModel
      );
    }

    this.modal.innerHTML = `
      <div class="nexus-settings-modal">
        <div class="nexus-settings-header">
          <h2>Settings</h2>

          <button
            id="settings-close"
            class="nexus-close"
          >
            ×
          </button>
        </div>

        <label>Provider</label>
        <select
          id="settings-provider"
          class="nexus-input"
        >
          <option value="gemini">
            Gemini
          </option>

          <option value="openrouter">
            OpenRouter
          </option>

          <option value="deepinfra">
            DeepInfra
          </option>

          <option value="litellm">
            LiteLLM
          </option>
        </select>

        <label>API Key</label>

        <input
          id="settings-key"
          class="nexus-input"
          type="password"
          placeholder="Enter API key"
        />

        <label>Model</label>

        <select
          id="settings-model"
          class="nexus-input"
        ></select>

        <button
          id="settings-load-models"
          class="nexus-button"
        >
          Load Models
        </button>

        <button
          id="settings-save"
          class="nexus-button"
        >
          Save
        </button>
      </div>
    `;

    document.documentElement.appendChild(
      this.modal
    );

    const providerEl =
      this.modal.querySelector(
        "#settings-provider"
      );

    const keyEl =
      this.modal.querySelector(
        "#settings-key"
      );

    const modelEl =
      this.modal.querySelector(
        "#settings-model"
      );

    providerEl.value =
      savedProvider;

    keyEl.value = savedKey;

    if (savedKey) {
      this.loadModels(
        savedModel
      );
    } else {
      modelEl.innerHTML =
        `<option>Enter API key first</option>`;
    }

    this.modal
      .querySelector(
        "#settings-close"
      )
      .addEventListener(
        "click",
        () => {
          this.close();
        }
      );

    providerEl.addEventListener(
      "change",
      () => {
        this.loadModels();
      }
    );

    this.modal
      .querySelector(
        "#settings-load-models"
      )
      .addEventListener(
        "click",
        async () => {
          await this.loadModels();
        }
      );

    this.modal
      .querySelector(
        "#settings-save"
      )
      .addEventListener(
        "click",
        async () => {
          const provider =
            providerEl.value;

          const apiKey =
            keyEl.value.trim();

          const model =
            modelEl.value;

          StorageService.set(
            "provider",
            provider
          );

          StorageService.set(
            "apiKey",
            apiKey
          );

          StorageService.set(
            "model",
            model
          );

          try {
            const contextLimit =
              await ContextService.getContextLimit(
                provider,
                model
              );

            StorageService.set(
              "contextLimit",
              contextLimit
            );

            console.log(
              "[Settings] context limit:",
              contextLimit
            );
          } catch (error) {
            console.error(
              "[Settings] context lookup failed:",
              error
            );

            StorageService.set(
              "contextLimit",
              32000
            );
          }

          alert(
            "Settings saved"
          );

          this.close();
        }
      );

    this.modal.addEventListener(
      "click",
      e => {
        if (
          e.target ===
          this.modal
        ) {
          this.close();
        }
      }
    );
  }

  async loadModels(
    selected = ""
  ) {
    console.log(
      "[Settings] loadModels called"
    );

    if (!this.modal) {
      console.log(
        "[Settings] modal missing"
      );
      return;
    }

    const modelEl =
      this.modal.querySelector(
        "#settings-model"
      );

    const providerEl =
      this.modal.querySelector(
        "#settings-provider"
      );

    const keyEl =
      this.modal.querySelector(
        "#settings-key"
      );

    if (
      !modelEl ||
      !providerEl ||
      !keyEl
    ) {
      console.error(
        "[Settings] DOM elements missing"
      );
      return;
    }

    const provider =
      providerEl.value;

    const apiKey =
      keyEl.value.trim();

    console.log(
      "[Settings] provider:",
      provider
    );

    console.log(
      "[Settings] apiKey exists:",
      !!apiKey
    );

    if (!apiKey) {
      modelEl.innerHTML =
        `<option>Enter API key first</option>`;
      return;
    }

    modelEl.innerHTML =
      `<option>Loading...</option>`;

    try {
      console.log(
        "[STEP A] before getModels"
      );

      const models =
        await Promise.race([
          (async () => {
            console.log(
              "[STEP B] calling AIService.getModels"
            );

            const result =
              await AIService.getModels(
                provider,
                apiKey
              );

            console.log(
              "[STEP C] getModels returned",
              result
            );

            return result;
          })(),

          new Promise(
            (_, reject) =>
              setTimeout(
                () =>
                  reject(
                    new Error(
                      "Model load timeout (15s)"
                    )
                  ),
                15000
              )
          )
        ]);

      console.log(
        "[Settings] models:",
        models
      );

      modelEl.innerHTML = "";

      if (
        !models ||
        !models.length
      ) {
        modelEl.innerHTML =
          `<option>No models found</option>`;
        return;
      }

      models.forEach(
        model => {
          const option =
            document.createElement(
              "option"
            );

          const value =
            typeof model ===
            "string"
              ? model
              : model.id ||
                model.name;

          const label =
            typeof model ===
            "string"
              ? model
              : model.name ||
                model.id;

          option.value =
            value;

          option.textContent =
            label;

          if (
            value ===
            selected
          ) {
            option.selected =
              true;
          }

          modelEl.appendChild(
            option
          );
        }
      );
    } catch (error) {
      console.error(
        "[Settings] loadModels failed"
      );

      console.error(
        "error object:",
        error
      );

      console.error(
        "message:",
        error?.message
      );

      console.error(
        "stack:",
        error?.stack
      );

      alert(
        error?.message ||
        "Unknown model load error"
      );

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