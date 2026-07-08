export default class ActionParserService {
  static extractActionBlock(
    text
  ) {
    const blocks =
      this.extractActionBlocks(
        text
      );

    return (
      blocks[0] || null
    );
  }

  static extractActionBlocks(
    text
  ) {
    if (
      !text ||
      typeof text !==
        "string"
    ) {
      return [];
    }

    const blocks = [];

    const regex =
      /```nexus-action\s*([\s\S]*?)```/g;

    let match;

    while (
      (match =
        regex.exec(text)) !==
      null
    ) {
      blocks.push(
        match[1].trim()
      );
    }

    return blocks;
  }

  static parseAction(
    text
  ) {
    const result =
      this.parseActions(
        text
      );

    if (
      !result.success ||
      !result.actions.length
    ) {
      return {
        success: false,
        error:
          "No nexus-action block found"
      };
    }

    return {
      success: true,
      action:
        result.actions[0]
    };
  }

  static parseActions(
    text
  ) {
    const blocks =
      this.extractActionBlocks(
        text
      );

    if (
      !blocks.length
    ) {
      return {
        success: false,
        error:
          "No nexus-action block found",
        actions: []
      };
    }

    const actions =
      [];

    for (const block of blocks) {
      try {
        const action =
          JSON.parse(
            block
          );

        if (
          !this.validateAction(
            action
          )
        ) {
          console.warn(
            "Unsupported action:",
            action
          );

          continue;
        }

        actions.push(
          action
        );
      } catch (error) {
        console.warn(
          "Invalid action JSON:",
          error
        );
      }
    }

    if (
      !actions.length
    ) {
      return {
        success: false,
        error:
          "No valid actions found",
        actions: []
      };
    }

    return {
      success: true,
      actions
    };
  }

  static validateAction(
    action
  ) {
    if (
      !action ||
      typeof action !==
        "object"
    ) {
      return false;
    }

    switch (
      action.type
    ) {
      case "patch_file":
        return (
          typeof action.file ===
            "string" &&
          typeof action.search ===
            "string" &&
          typeof action.replace ===
            "string"
        );

      case "replace_file":
        return (
          typeof action.file ===
            "string" &&
          typeof action.content ===
            "string"
        );

      case "replace_symbol":
        return (
          typeof action.file ===
            "string" &&
          typeof action.symbol ===
            "string" &&
          typeof action.content ===
            "string"
        );

      case "create_file":
        return (
          typeof action.file ===
            "string" &&
          typeof action.content ===
            "string"
        );

      case "delete_file":
        return (
          typeof action.file ===
            "string"
        );

      case "rename_file":
        return (
          typeof action.from ===
            "string" &&
          typeof action.to ===
            "string"
        );

      case "open_file":
      case "focus_file":
      case "undo_file":
        return (
          typeof action.file ===
            "string"
        );

      default:
        return false;
    }
  }

  static isActionResponse(
    text
  ) {
    return (
      this.extractActionBlocks(
        text
      ).length > 0
    );
  }
}