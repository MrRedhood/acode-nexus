export default class PatchValidatorService {
  static validateAction(action) {
    if (!action) {
      return {
        valid: false,
        error: "Missing action"
      };
    }

    if (!action.type) {
      return {
        valid: false,
        error: "Missing action type"
      };
    }

    switch (action.type) {
      case "patch_file":
        return this.validatePatchAction(
          action
        );

      case "replace_file":
        return this.validateReplaceAction(
          action
        );

      case "open_file":
      case "focus_file":
        return this.validateFileAction(
          action
        );

      default:
        return {
          valid: false,
          error:
            "Unsupported action type"
        };
    }
  }

  static validateFileAction(
    action
  ) {
    if (!action.file) {
      return {
        valid: false,
        error: "Missing file"
      };
    }

    return {
      valid: true
    };
  }

  static validateReplaceAction(
    action
  ) {
    if (!action.file) {
      return {
        valid: false,
        error: "Missing file"
      };
    }

    if (
      typeof action.content !==
      "string"
    ) {
      return {
        valid: false,
        error: "Missing content"
      };
    }

    return {
      valid: true
    };
  }

  static validatePatchAction(
    action
  ) {
    if (!action.file) {
      return {
        valid: false,
        error: "Missing file"
      };
    }

    if (
      typeof action.search !==
        "string" ||
      !action.search.length
    ) {
      return {
        valid: false,
        error:
          "Missing search text"
      };
    }

    if (
      typeof action.replace !==
      "string"
    ) {
      return {
        valid: false,
        error:
          "Missing replace text"
      };
    }

    return {
      valid: true
    };
  }

  static validatePatchAgainstContent(
    action,
    fileContent
  ) {
    const baseValidation =
      this.validatePatchAction(
        action
      );

    if (
      !baseValidation.valid
    ) {
      return baseValidation;
    }

    if (
      typeof fileContent !==
      "string"
    ) {
      return {
        valid: false,
        error:
          "Invalid file content"
      };
    }

    const search =
      action.search;

    const matches =
      fileContent.split(search)
        .length - 1;

    if (matches === 0) {
      return {
        valid: false,
        error:
          "Search text not found"
      };
    }

    if (matches > 1) {
      return {
        valid: false,
        error:
          "Search text matches multiple locations"
      };
    }

    return {
      valid: true
    };
  }
}