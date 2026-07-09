import StorageService from "./storage-service.js";
import SessionService from "./session-service.js";
import RouterService from "./router-service.js";
import EditService from "./edit-service.js";
import ProviderService from "./provider-service.js";
import AIMessageService from "./ai-message-service.js";

export default class AIService {
  static async getModels(
    provider = null,
    apiKey = null
  ) {
    provider ??=
      StorageService.get(
        "provider"
      );

    apiKey ??=
      StorageService.get(
        "apiKey"
      );

    if (
      !provider ||
      !apiKey
    ) {
      throw new Error(
        "Provider or API key missing"
      );
    }

    return ProviderService.getModels(
      provider,
      apiKey
    );
  }

  static async sendMessage(
    signal = null
  ) {
    const payload =
      await AIMessageService.prepare();

    return ProviderService.chat(
      payload.provider,
      payload.apiKey,
      payload.model,
      payload.processedMessages,
      signal
    );
  }

  static async sendMessageStream(
    onChunk,
    signal = null
  ) {
    const messages =
      SessionService.getMessages();

    if (
      RouterService.isEditRequest(
        messages
      )
    ) {
      return EditService.sendMessageStream(
        messages,
        onChunk,
        signal
      );
    }

    const payload =
      await AIMessageService.prepare();

    return ProviderService.streamChat(
      payload.provider,
      payload.apiKey,
      payload.model,
      payload.processedMessages,
      onChunk,
      signal
    );
  }
}