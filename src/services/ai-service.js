import StorageService from "./storage-service.js";
import SessionService from "./session-service.js";
import TokenBudgetService from "./token-budget-service.js";
import RouterService from "./router-service.js";
import EditService from "./edit-service.js";
import PromptService from "./prompt-service.js";
import MessagePreprocessorService from "./message-preprocessor-service.js";
import ProviderService from "./provider-service.js";

// TEST
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

    return await ProviderService.getModels(
      provider,
      apiKey
    );
  }

  static async prepareMessages() {
    const provider =
      StorageService.get(
        "provider"
      );

    const apiKey =
      StorageService.get(
        "apiKey"
      );

    const model =
      StorageService.get(
        "model"
      );

    const messages =
      SessionService.getMessages();

    const cleanedMessages =
      messages
        .filter(
          msg =>
            msg &&
            msg.role &&
            typeof msg.content ===
              "string"
        )
        .map(msg => ({
          ...msg
        }));

    let processedMessages =
      await MessagePreprocessorService.process(
        cleanedMessages
      );

    const systemPrompt =
      PromptService.buildChatPrompt();

    if (systemPrompt) {
      processedMessages.unshift({
        role: "system",
        content:
          systemPrompt
      });
    }

    processedMessages =
      TokenBudgetService.enforceBudget(
        processedMessages
      );

    return {
      provider,
      apiKey,
      model,
      processedMessages
    };
  }

  static async sendMessage(
    signal = null
  ) {
    const payload =
      await this.prepareMessages();

    return await ProviderService.chat(
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
      return await EditService.sendMessageStream(
        messages,
        onChunk,
        signal
      );
    }

    const payload =
      await this.prepareMessages();

    return await ProviderService.streamChat(
      payload.provider,
      payload.apiKey,
      payload.model,
      payload.processedMessages,
      onChunk,
      signal
    );
  }
}