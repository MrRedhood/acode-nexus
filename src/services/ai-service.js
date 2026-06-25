import GeminiProvider from "../providers/gemini.js";
import StorageService from "./storage-service.js";
import SessionService from "./session-service.js";

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

  static async sendMessage() {
    const provider =
      StorageService.get("provider");

    const apiKey =
      StorageService.get("apiKey");

    const model =
      StorageService.get("model");

    if (!provider) {
      throw new Error("No provider selected");
    }

    if (!apiKey) {
      throw new Error("No API key saved");
    }

    if (!model) {
      throw new Error("No model selected");
    }

    const messages =
      SessionService.getMessages();

    if (!messages.length) {
      throw new Error("No messages found");
    }

    const cleanedMessages =
      messages
        .filter(
          msg =>
            msg &&
            msg.role &&
            typeof msg.content === "string"
        )
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

    if (provider === "gemini") {
      return await GeminiProvider.chat(
        apiKey,
        model,
        cleanedMessages
      );
    }

    throw new Error("Unsupported provider");
  }
}