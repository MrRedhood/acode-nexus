import GeminiProvider from "../providers/gemini.js";
import StorageService from "./storage-service.js";

export default class AIService {
  static async getModels(provider = null, apiKey = null) {
    provider ??= StorageService.get("provider");
    apiKey ??= StorageService.get("apiKey");

    if (!provider || !apiKey) {
      throw new Error("Provider or API key missing");
    }

    if (provider === "gemini") {
      return await GeminiProvider.getModels(apiKey);
    }

    throw new Error("Unsupported provider");
  }

  static async sendMessage(message) {
    const provider = StorageService.get("provider");
    const apiKey = StorageService.get("apiKey");
    const model = StorageService.get("model");

    if (!provider) {
      throw new Error("No provider selected");
    }

    if (!apiKey) {
      throw new Error("No API key saved");
    }

    if (!model) {
      throw new Error("No model selected");
    }

    if (provider === "gemini") {
      return await GeminiProvider.chat(
        apiKey,
        model,
        message
      );
    }

    throw new Error("Unsupported provider");
  }
}