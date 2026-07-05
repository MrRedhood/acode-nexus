import GeminiProvider from "../providers/gemini.js";

export default class ProviderService {
  static getProvider(provider) {
    switch (provider) {
      case "gemini":
        return GeminiProvider;

      default:
        throw new Error(
          `Unsupported provider: ${provider}`
        );
    }
  }

  static async getModels(
    provider,
    apiKey
  ) {
    const providerImpl =
      this.getProvider(provider);

    if (
      !providerImpl.getModels
    ) {
      throw new Error(
        `${provider} does not support model listing`
      );
    }

    return await providerImpl.getModels(
      apiKey
    );
  }

  static async chat(
    provider,
    apiKey,
    model,
    messages,
    signal = null
  ) {
    const providerImpl =
      this.getProvider(provider);

    if (
      !providerImpl.chat
    ) {
      throw new Error(
        `${provider} does not support chat`
      );
    }

    return await providerImpl.chat(
      apiKey,
      model,
      messages,
      signal
    );
  }

  static async streamChat(
    provider,
    apiKey,
    model,
    messages,
    onChunk,
    signal = null
  ) {
    const providerImpl =
      this.getProvider(provider);

    if (
      !providerImpl.streamChat
    ) {
      throw new Error(
        `${provider} does not support streaming`
      );
    }

    return await providerImpl.streamChat(
      apiKey,
      model,
      messages,
      onChunk,
      signal
    );
  }
}