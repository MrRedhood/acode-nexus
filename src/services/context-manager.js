import StorageService from "./storage-service.js";

export default class ContextManager {
  static estimateTokens(text = "") {
    if (!text) {
      return 0;
    }

    return Math.ceil(text.length / 3);
  }

  static estimateMessageTokens(message) {
    if (!message) {
      return 0;
    }

    return this.estimateTokens(
      message.content || ""
    );
  }

  static getContextLimit() {
    return (
      StorageService.get(
        "contextLimit"
      ) || 32000
    );
  }

  static getUsableInputLimit() {
    const contextLimit =
      this.getContextLimit();

    const reservedOutput =
      Math.ceil(
        contextLimit * 0.2
      );

    return (
      contextLimit -
      reservedOutput
    );
  }

  static getTotalTokens(
    messages
  ) {
    let total = 0;

    for (const msg of messages) {
      total +=
        this.estimateMessageTokens(
          msg
        );
    }

    return total;
  }

  static trimMessages(
    messages
  ) {
    if (
      !messages ||
      messages.length <= 2
    ) {
      return messages;
    }

    const usableLimit =
      this.getUsableInputLimit();

    const preserved = [];

    if (messages.length >= 2) {
      preserved.push(
        messages[
          messages.length - 2
        ]
      );

      preserved.push(
        messages[
          messages.length - 1
        ]
      );
    }

    let working =
      messages.slice(
        0,
        messages.length - 2
      );

    while (
      working.length > 0
    ) {
      const candidate =
        [
          ...working,
          ...preserved
        ];

      const tokens =
        this.getTotalTokens(
          candidate
        );

      if (
        tokens <=
        usableLimit
      ) {
        return candidate;
      }

      working.shift();
    }

    return preserved;
  }

  static prepareMessages(
    messages
  ) {
    const totalTokens =
      this.getTotalTokens(
        messages
      );

    const usableLimit =
      this.getUsableInputLimit();

    if (
      totalTokens <=
      usableLimit
    ) {
      return messages;
    }

    console.warn(
      "[ContextManager] Overflow detected"
    );

    console.warn(
      "Current:",
      totalTokens
    );

    console.warn(
      "Limit:",
      usableLimit
    );

    return this.trimMessages(
      messages
    );
  }
}