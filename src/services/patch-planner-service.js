export default class PatchPlannerService {
  static createPlan(
    userPrompt
  ) {
    if (!userPrompt) {
      return {
        strategy:
          "replace_file"
      };
    }

    const prompt =
      userPrompt.toLowerCase();

    if (
      /rename\s+\S+\s+to\s+\S+/i.test(
        prompt
      )
    ) {
      return {
        strategy:
          "rename_symbol"
      };
    }

    if (
      prompt.includes(
        "replace function"
      ) ||
      prompt.includes(
        "rewrite function"
      ) ||
      prompt.includes(
        "modify function"
      ) ||
      prompt.includes(
        "change function"
      )
    ) {
      return {
        strategy:
          "patch_function"
      };
    }

    if (
      prompt.includes(
        "replace class"
      ) ||
      prompt.includes(
        "rewrite class"
      ) ||
      prompt.includes(
        "modify class"
      )
    ) {
      return {
        strategy:
          "patch_class"
      };
    }

    if (
      prompt.includes(
        "insert"
      ) ||
      prompt.includes(
        "add"
      )
    ) {
      return {
        strategy:
          "insert"
      };
    }

    if (
      prompt.includes(
        "delete"
      ) ||
      prompt.includes(
        "remove"
      )
    ) {
      return {
        strategy:
          "delete"
      };
    }

    return {
      strategy:
        "replace_file"
      };
  }
}