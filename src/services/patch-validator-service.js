export default class PatchValidatorService {
  static validateAction(
    action
  ) {
    if (!action) {
      return this.fail(
        "Missing action"
      );
    }

    if (!action.type) {
      return this.fail(
        "Missing action type"
      );
    }

    switch (
      action.type
    ) {
      case "patch_file":
        return this.validatePatchAction(
          action
        );

      case "replace_file":
        return this.validateReplaceAction(
          action
        );

      case "replace_symbol":
        return this.validateReplaceSymbolAction(
          action
        );

      case "open_file":
      case "focus_file":
        return this.validateFileAction(
          action
        );

      case "undo_file":
        return this.validateUndoAction(
          action
        );

      default:
        return this.fail(
          `Unsupported action type: ${action.type}`
        );
    }
  }

  static validateActions(
    actions = []
  ) {
    const errors = [];
    const warnings = [];

    if (
      !Array.isArray(actions)
    ) {
      return {
        valid: false,
        errors: [
          "Actions must be an array."
        ],
        warnings
      };
    }

    if (
      actions.length === 0
    ) {
      return {
        valid: false,
        errors: [
          "No actions to validate."
        ],
        warnings
      };
    }

    const seen =
      new Set();

    for (const action of actions) {
      const result =
        this.validateAction(
          action
        );

      if (
        !result.valid
      ) {
        errors.push(
          result.error
        );
      }

      const key =
        JSON.stringify([
          action.type,
          action.file,
          action.search,
          action.content
        ]);

      if (
        seen.has(key)
      ) {
        warnings.push(
          `Duplicate action detected (${action.type})`
        );
      }

      seen.add(key);
    }

    return {
      valid:
        errors.length ===
        0,
      errors,
      warnings
    };
  }

  static validateFileAction(
    action
  ) {
    if (!action.file) {
      return this.fail(
        "Missing file"
      );
    }

    return this.success();
  }

  static validateUndoAction(
    action
  ) {
    if (!action.file) {
      return this.fail(
        "Missing file"
      );
    }

    return this.success();
  }

  static validateReplaceAction(
    action
  ) {
    if (!action.file) {
      return this.fail(
        "Missing file"
      );
    }

    if (
      typeof action.content !==
      "string"
    ) {
      return this.fail(
        "Missing content"
      );
    }

    return this.success();
  }

  static validateReplaceSymbolAction(
    action
  ) {
    if (
      typeof action.content !==
      "string"
    ) {
      return this.fail(
        "Missing symbol content"
      );
    }

    return this.success();
  }

  static validatePatchAction(
    action
  ) {
    if (!action.file) {
      return this.fail(
        "Missing file"
      );
    }

    if (
      typeof action.search !==
        "string" ||
      !action.search.length
    ) {
      return this.fail(
        "Missing search text"
      );
    }

    if (
      typeof action.replace !==
      "string"
    ) {
      return this.fail(
        "Missing replace text"
      );
    }

    return this.success();
  }

  static validatePatchAgainstContent(
    action,
    fileContent
  ) {
    const base =
      this.validatePatchAction(
        action
      );

    if (
      !base.valid
    ) {
      return base;
    }

    if (
      typeof fileContent !==
      "string"
    ) {
      return this.fail(
        "Invalid file content"
      );
    }

    const matches =
      fileContent.split(
        action.search
      ).length - 1;

    if (
      matches === 0
    ) {
      return this.fail(
        "Search text not found"
      );
    }

    if (
      matches > 1
    ) {
      return this.fail(
        "Search text matches multiple locations"
      );
    }

    return this.success();
  }

  static success() {
    return {
      valid: true,
      error: null
    };
  }

  static fail(
    error
  ) {
    return {
      valid: false,
      error
    };
  }
}