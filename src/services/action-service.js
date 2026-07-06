import FileService from "./file-service.js";
import PatchService from "./patch-service.js";
import DiffPreviewService from "./diff-preview-service.js";

export default class ActionService {
  static SUPPORTED_ACTIONS = [
    "focus_file",
    "open_file",
    "replace_file",
    "patch_file",
    "undo_file"
  ];

  static parseActions(text) {
    console.log("RAW AI TEXT:");
    console.log(text);

    if (!text) {
      return [];
    }

    const matches =
      text.match(
        /```nexus-action\s*([\s\S]*?)```/g
      ) || [];

    console.log(
      "ACTION BLOCK MATCHES:",
      matches
    );

    const actions = [];

    matches.forEach(block => {
      try {
        const json = block
          .replace(
            /```nexus-action/,
            ""
          )
          .replace(
            /```$/,
            ""
          )
          .trim();

        console.log(
          "ACTION JSON:",
          json
        );

        const action =
          JSON.parse(json);

        actions.push(action);
      } catch (error) {
        console.error(
          "Action parse failed:",
          error
        );
      }
    });

    console.log(
      "PARSED ACTIONS:",
      actions
    );

    return actions;
  }

  static validateAction(action) {
    if (!action) {
      return false;
    }

    if (!action.type) {
      return false;
    }

    if (
      !this.SUPPORTED_ACTIONS.includes(
        action.type
      )
    ) {
      return false;
    }

    if (
      action.type ===
        "focus_file" ||
      action.type ===
        "open_file" ||
      action.type ===
        "undo_file"
    ) {
      return !!action.file;
    }

    if (
      action.type ===
      "replace_file"
    ) {
      return (
        !!action.file &&
        typeof action.content ===
          "string"
      );
    }

    if (
      action.type ===
      "patch_file"
    ) {
      return (
        !!action.file &&
        typeof action.search ===
          "string" &&
        typeof action.replace ===
          "string"
      );
    }

    return true;
  }

  static async executeAction(
    action
  ) {
    console.log(
      "EXECUTE ACTION:",
      action
    );

    if (
      !this.validateAction(
        action
      )
    ) {
      return {
        success: false,
        error:
          "Invalid action"
      };
    }

    switch (action.type) {
      case "focus_file":
        return await FileService.focusFile(
          action.file,
          action.line
        );

      case "open_file":
        return await FileService.openFile(
          action.file
        );

      case "replace_file": {
        const approved =
          await DiffPreviewService.previewReplace(
            action
          );

        if (!approved) {
          return {
            success: false,
            cancelled: true
          };
        }

        return await PatchService.replaceFile(
          action
        );
      }

      case "patch_file": {
        const approved =
          await DiffPreviewService.previewPatch(
            action
          );

        if (!approved) {
          return {
            success: false,
            cancelled: true
          };
        }

        return await PatchService.patchFile(
          action
        );
      }

      case "undo_file":
        return await PatchService.undoFile(
          action
        );

      default:
        return {
          success: false,
          error:
            "Unsupported action"
        };
    }
  }
}