export default class ActionValidationService {
  static SUPPORTED_ACTIONS = [
    "focus_file",
    "open_file",
    "replace_file",
    "replace_symbol",
    "patch_file",
    "undo_file"
  ];

  static isSupported(type) {
    return this.SUPPORTED_ACTIONS.includes(
      type
    );
  }

  static validateAction(action) {
    if (
      !action ||
      typeof action !==
        "object"
    ) {
      return {
        valid: false,
        error:
          "Missing action."
      };
    }

    if (!action.type) {
      return {
        valid: false,
        error:
          "Missing action type."
      };
    }

    if (
      !this.isSupported(
        action.type
      )
    ) {
      return {
        valid: false,
        error: `Unsupported action "${action.type}".`
      };
    }

    switch (
      action.type
    ) {
      case "focus_file":
      case "open_file":
      case "undo_file":
        if (!action.file) {
          return {
            valid: false,
            error:
              "Missing file."
          };
        }
        break;

      case "replace_file":
        if (
          !action.file ||
          typeof action.content !==
            "string"
        ) {
          return {
            valid: false,
            error:
              "Invalid replace_file action."
          };
        }
        break;

      case "replace_symbol":
        if (
          !action.file ||
          !action.symbol ||
          typeof action.content !==
            "string"
        ) {
          return {
            valid: false,
            error:
              "Invalid replace_symbol action."
          };
        }
        break;

      case "patch_file":
        if (
          !action.file ||
          typeof action.search !==
            "string" ||
          typeof action.replace !==
            "string"
        ) {
          return {
            valid: false,
            error:
              "Invalid patch_file action."
          };
        }
        break;
    }

    return {
      valid: true
    };
  }

  static validateActions(
    actions = []
  ) {
    const valid = [];
    const errors = [];

    for (const action of actions) {
      const result =
        this.validateAction(
          action
        );

      if (
        result.valid
      ) {
        valid.push(
          action
        );
      } else {
        errors.push({
          action,
          error:
            result.error
        });
      }
    }

    return {
      success:
        errors.length === 0,
      actions: valid,
      errors
    };
  }
}