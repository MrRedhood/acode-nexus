export default class CommandService {
  static process(messages) {
    if (!messages?.length) {
      return messages;
    }

    const transformed = [...messages];

    const lastMessage =
      transformed[transformed.length - 1];

    if (
      !lastMessage ||
      lastMessage.role !== "user"
    ) {
      return transformed;
    }

    const content =
      lastMessage.content.trim();

    if (!content.startsWith("/")) {
      return transformed;
    }

    const firstSpace =
      content.indexOf(" ");

    const command =
      (
        firstSpace === -1
          ? content.slice(1)
          : content.slice(1, firstSpace)
      ).toLowerCase();

    const userPrompt =
      firstSpace === -1
        ? ""
        : content.slice(firstSpace + 1);

    const systemPrompt =
      this.buildPrompt(
        command,
        userPrompt
      );

    if (!systemPrompt) {
      return transformed;
    }

    transformed[
      transformed.length - 1
    ] = {
      ...lastMessage,
      content: systemPrompt
    };

    return transformed;
  }

  static buildPrompt(
    command,
    userPrompt
  ) {
    const prompts = {
      explain: `
SYSTEM COMMAND MODE: EXPLAIN

Rules:
1. Explain simply
2. Break down step by step
3. Use examples when helpful

User request:
${userPrompt}
      `,

      fix: `
SYSTEM COMMAND MODE: FIX

Rules:
1. Find bugs
2. Explain root cause
3. Give corrected full code
4. Mention improvements

User request:
${userPrompt}
      `,

      refactor: `
SYSTEM COMMAND MODE: REFACTOR

Rules:
1. Improve structure
2. Improve readability
3. Reduce duplication
4. Return full improved code

User request:
${userPrompt}
      `,

      optimize: `
SYSTEM COMMAND MODE: OPTIMIZE

Rules:
1. Find bottlenecks
2. Improve performance
3. Reduce unnecessary work
4. Return optimized version

User request:
${userPrompt}
      `,

      summarize: `
SYSTEM COMMAND MODE: SUMMARIZE

Rules:
1. Preserve key points
2. Remove fluff
3. Keep concise

User request:
${userPrompt}
      `
    };

    return prompts[command] || null;
  }
}