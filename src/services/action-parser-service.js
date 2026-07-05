export default class ActionParserService {
  static extractActionBlock(
    text
  ) {
    if (
      !text ||
      typeof text !== "string"
    ) {
      return null;
    }

    const match =
      text.match(
        /```nexus-action\s*([\s\S]*?)```/
      );

    if (!match) {
      return null;
    }

    return match[1].trim();
  }

  static parseAction(text) {
    const block =
      this.extractActionBlock(
        text
      );

    if (!block) {
      return {
        success: false,
        error:
          "No nexus-action block found"
      };
    }

    try {
      const action =
        JSON.parse(block);

      return {
        success: true,
        action
      };
    } catch (error) {
      return {
        success: false,
        error:
          "Invalid JSON in action block",
        details:
          error.message
      };
    }
  }

  static isActionResponse(
    text
  ) {
    return Boolean(
      this.extractActionBlock(
        text
      )
    );
  }
}