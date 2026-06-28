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

  static createSummary(
    messages
  ) {
    if (
      !messages ||
      messages.length === 0
    ) {
      return null;
    }

    const lines = [
      "Conversation Summary:"
    ];

    for (const msg of messages) {
      const role =
        msg.role === "assistant"
          ? "ASSISTANT"
          : "USER";

      let content =
        msg.content || "";

      content =
        content
          .replace(/\s+/g, " ")
          .trim();

      if (
        content.length > 120
      ) {
        content =
          content.slice(
            0,
            120
          ) + "...";
      }

      lines.push(
        `- ${role}: ${content}`
      );
    }

    return {
      id:
        "summary_" +
        Date.now(),
      role: "system",
      content:
        lines.join("\n")
    };
  }

  static compressMessages(
    messages
  ) {
    if (
      !messages ||
      messages.length <= 6
    ) {
      return messages;
    }

    const preserveCount = 6;

    const oldMessages =
      messages.slice(
        0,
        messages.length -
          preserveCount
      );

    const recentMessages =
      messages.slice(
        messages.length -
          preserveCount
      );

    const summary =
      this.createSummary(
        oldMessages
      );

    if (!summary) {
      return messages;
    }

    return [
      summary,
      ...recentMessages
    ];
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
    const usableLimit =
      this.getUsableInputLimit();

    let totalTokens =
      this.getTotalTokens(
        messages
      );

    if (
      totalTokens <=
      usableLimit
    ) {
      return messages;
    }

    console.warn(
      "[ContextManager] Overflow detected"
    );

    messages =
      this.compressMessages(
        messages
      );

    totalTokens =
      this.getTotalTokens(
        messages
      );

    if (
      totalTokens <=
      usableLimit
    ) {
      console.warn(
        "[ContextManager] Compression applied"
      );

      return messages;
    }

    console.warn(
      "[ContextManager] Compression insufficient, trimming"
    );

    return this.trimMessages(
      messages
    );
  }
}