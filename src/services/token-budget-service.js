export default class TokenBudgetService {
  static DEFAULT_MAX_TOKENS =
    24000;

  static CHARS_PER_TOKEN = 4;

  static estimateTokens(text) {
    if (!text) {
      return 0;
    }

    return Math.ceil(
      text.length /
        this.CHARS_PER_TOKEN
    );
  }

  static estimateMessageTokens(
    messages
  ) {
    if (
      !messages ||
      !messages.length
    ) {
      return 0;
    }

    let total = 0;

    for (const msg of messages) {
      total +=
        this.estimateTokens(
          msg.content || ""
        ) + 8;
    }

    return total;
  }

  static isProtectedMessage(
    message,
    index,
    totalMessages
  ) {
    if (!message) {
      return false;
    }

    if (
      message.role === "system"
    ) {
      return true;
    }

    if (
      index ===
      totalMessages - 1
    ) {
      return true;
    }

    if (
      message.content?.includes(
        "LIVE EDITOR BUFFER"
      )
    ) {
      return true;
    }

    if (
      message.content?.includes(
        "ACTIVE FILE"
      )
    ) {
      return true;
    }

    return false;
  }

  static truncateMessage(
    message,
    maxTokens
  ) {
    if (
      !message ||
      !message.content
    ) {
      return message;
    }

    const maxChars =
      maxTokens *
      this.CHARS_PER_TOKEN;

    if (
      message.content.length <=
      maxChars
    ) {
      return message;
    }

    return {
      ...message,
      content:
        message.content.slice(
          0,
          maxChars
        ) +
        "\n\n[TRUNCATED DUE TO TOKEN LIMIT]"
    };
  }

  static enforceBudget(
    messages,
    maxTokens =
      this.DEFAULT_MAX_TOKENS
  ) {
    if (
      !messages ||
      !messages.length
    ) {
      return messages || [];
    }

    let working =
      messages.map(msg => ({
        ...msg
      }));

    let total =
      this.estimateMessageTokens(
        working
      );

    console.log(
      "[TokenBudget] Current:",
      total
    );
    console.log(
      "[TokenBudget] Limit:",
      maxTokens
    );

    if (total <= maxTokens) {
      return working;
    }

    for (
      let i = 0;
      i < working.length;
      i++
    ) {
      if (
        total <= maxTokens
      ) {
        break;
      }

      if (
        this.isProtectedMessage(
          working[i],
          i,
          working.length
        )
      ) {
        continue;
      }

      total -=
        this.estimateTokens(
          working[i].content
        );

      working.splice(i, 1);
      i--;
    }

    total =
      this.estimateMessageTokens(
        working
      );

    if (total > maxTokens) {
      for (
        let i = 0;
        i < working.length;
        i++
      ) {
        if (
          total <= maxTokens
        ) {
          break;
        }

        if (
          !this.isProtectedMessage(
            working[i],
            i,
            working.length
          )
        ) {
          continue;
        }

        const currentTokens =
          this.estimateTokens(
            working[i].content
          );

        const allowed =
          Math.max(
            2000,
            currentTokens -
              (total -
                maxTokens)
          );

        working[i] =
          this.truncateMessage(
            working[i],
            allowed
          );

        total =
          this.estimateMessageTokens(
            working
          );
      }
    }

    console.log(
      "[TokenBudget] Final:",
      total
    );

    return working;
  }
}