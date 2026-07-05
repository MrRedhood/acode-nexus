import StorageService from "./storage-service.js";
import PromptService from "./prompt-service.js";
import ProviderService from "./provider-service.js";

export default class EditService {
  static extractLiveBuffer(messages) {
    if (!messages?.length) {
      return null;
    }

    for (
      let i = messages.length - 1;
      i >= 0;
      i--
    ) {
      const msg =
        messages[i];

      if (
        msg.role === "user" &&
        msg.content &&
        (
          msg.content.includes(
            "LIVE EDITOR BUFFER"
          ) ||
          msg.content.includes(
            "ACTIVE FILE"
          ) ||
          msg.content.includes(
            "LIVE EDITOR FILE"
          )
        )
      ) {
        return msg.content;
      }
    }

    return null;
  }

  static extractUserRequest(messages) {
    if (!messages?.length) {
      return "";
    }

    for (
      let i = messages.length - 1;
      i >= 0;
      i--
    ) {
      const msg =
        messages[i];

      if (
        msg.role === "user" &&
        msg.content
      ) {
        return msg.content;
      }
    }

    return "";
  }

  static cleanUserRequest(text) {
    if (!text) {
      return "";
    }

    const markers = [
      "ACTIVE FILE (LIVE EDITOR BUFFER)",
      "LIVE EDITOR FILE",
      "ACTIVE FILE"
    ];

    let cleaned = text;

    for (const marker of markers) {
      const index =
        cleaned.indexOf(marker);

      if (index !== -1) {
        cleaned =
          cleaned.slice(0, index);
      }
    }

    return cleaned.trim();
  }

  static async prepareMessages(
    messages
  ) {
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

    if (!provider) {
      throw new Error(
        "No provider selected"
      );
    }

    if (!apiKey) {
      throw new Error(
        "No API key saved"
      );
    }

    if (!model) {
      throw new Error(
        "No model selected"
      );
    }

    const liveBuffer =
      this.extractLiveBuffer(
        messages
      );

    if (!liveBuffer) {
      throw new Error(
        "No live editor buffer found"
      );
    }

    const rawUserRequest =
      this.extractUserRequest(
        messages
      );

    const userRequest =
      this.cleanUserRequest(
        rawUserRequest
      );

    const processedMessages = [
      {
        role: "system",
        content:
          PromptService.buildEditPrompt()
      },
      {
        role: "user",
        content: `
${liveBuffer}

USER REQUEST:
${
  userRequest ||
  "[No request provided]"
}
`
      }
    ];

    return {
      provider,
      apiKey,
      model,
      processedMessages
    };
  }

  static async sendMessageStream(
    messages,
    onChunk,
    signal = null
  ) {
    const {
      provider,
      apiKey,
      model,
      processedMessages
    } =
      await this.prepareMessages(
        messages
      );

    console.log(
      "EDIT MODE PROMPT:",
      JSON.stringify(
        processedMessages,
        null,
        2
      )
    );

    return await ProviderService.streamChat(
      provider,
      apiKey,
      model,
      processedMessages,
      onChunk,
      signal
    );
  }
}