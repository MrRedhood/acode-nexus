export default class PatchApplierService {
  static apply(
    action,
    originalContent = ""
  ) {
    if (!action) {
      throw new Error(
        "Missing action."
      );
    }

    switch (
      action.type
    ) {
      case "replace_file":
        return this.replaceFile(
          action,
          originalContent
        );

      case "patch_file":
        return this.patchFile(
          action,
          originalContent
        );

      case "create_file":
        return this.createFile(
          action
        );

      default:
        throw new Error(
          `Unsupported action "${action.type}".`
        );
    }
  }

  static replaceFile(
    action
  ) {
    return (
      action.content || ""
    );
  }

  static createFile(
    action
  ) {
    return (
      action.content || ""
    );
  }

  static patchFile(
    action,
    originalContent
  ) {
    if (
      typeof action.content ===
      "string"
    ) {
      return action.content;
    }

    if (
      Array.isArray(
        action.operations
      )
    ) {
      return this.applyOperations(
        originalContent,
        action.operations
      );
    }

    throw new Error(
      "Patch action contains no supported patch data."
    );
  }

  static applyOperations(
    content,
    operations
  ) {
    let lines =
      content.split("\n");

    for (const op of operations) {
      switch (
        op.type
      ) {
        case "insert":
          lines.splice(
            op.line - 1,
            0,
            ...(op.content || "")
              .split("\n")
          );
          break;

        case "replace":
          lines.splice(
            op.line - 1,
            op.deleteCount ||
              1,
            ...(op.content || "")
              .split("\n")
          );
          break;

        case "delete":
          lines.splice(
            op.line - 1,
            op.deleteCount ||
              1
          );
          break;

        default:
          throw new Error(
            `Unsupported patch operation "${op.type}".`
          );
      }
    }

    return lines.join("\n");
  }
}