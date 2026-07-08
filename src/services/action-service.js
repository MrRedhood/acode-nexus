import FileService from "./file-service.js";
import PatchService from "./patch-service.js";
import ActionParserService from "./action-parser-service.js";
import PatchSetService from "./patch-set-service.js";
import MultiDiffPreviewService from "./multi-diff-preview-service.js";
import WorkspaceRefactorService from "./workspace-refactor-service.js";

export default class ActionService {
  static SUPPORTED_ACTIONS = [
    "focus_file",
    "open_file",
    "replace_file",
    "patch_file",
    "undo_file"
  ];

  static parseActions(text) {
    const result =
      ActionParserService.parseActions(
        text
      );

    if (!result.success) {
      console.warn(
        result.error
      );
      return [];
    }

    return result.actions;
  }

  static validateAction(
    action
  ) {
    if (!action) {
      return false;
    }

    if (!action.type) {
      return false;
    }

    return this.SUPPORTED_ACTIONS.includes(
      action.type
    );
  }

  static async executePatchActions(
    actions,
    editContext = null
  ) {
    if (
      !actions ||
      !actions.length
    ) {
      return {
        success: true,
        results: []
      };
    }

    const patchActions =
      actions.filter(
        action =>
          action.type ===
            "patch_file" ||
          action.type ===
            "replace_file"
      );

    if (
      !patchActions.length
    ) {
      return {
        success: true,
        results: []
      };
    }

    const validation =
      WorkspaceRefactorService.build(
        patchActions,
        editContext
      );

    console.log(
      "EDIT CONTEXT:"
    );
    console.log(
      editContext
    );

    console.log(
      "WORKSPACE REFACTOR:"
    );
    console.log(
      WorkspaceRefactorService.summarize(
        validation
      )
    );

    if (
      !validation.success
    ) {
      return {
        success: false,
        error:
          validation.errors.join(
            "\n"
          ),
        warnings:
          validation.warnings
      };
    }

    const patchSet =
      validation.patchSet;

    if (
      !PatchSetService.validate(
        patchSet
      )
    ) {
      return {
        success: false,
        error:
          "Invalid patch set."
      };
    }

    const approved =
      await MultiDiffPreviewService.preview(
        patchSet
      );

    if (!approved) {
      return {
        success: false,
        cancelled: true
      };
    }

    return await PatchService.applyPatchSet(
      patchSet,
      editContext
    );
  }

  static async executeAction(
    action,
    editContext = null
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

    switch (
      action.type
    ) {
      case "focus_file":
        return await FileService.focusFile(
          action.file,
          action.line
        );

      case "open_file":
        return await FileService.openFile(
          action.file
        );

      case "replace_file":
      case "patch_file":
        return await this.executePatchActions(
          [action],
          editContext
        );

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

  static async executeActions(
    actions,
    editContext = null
  ) {
    if (
      !actions ||
      !actions.length
    ) {
      return [];
    }

    const results = [];

    const patchActions =
      actions.filter(
        action =>
          action.type ===
            "patch_file" ||
          action.type ===
            "replace_file"
      );

    const otherActions =
      actions.filter(
        action =>
          action.type !==
            "patch_file" &&
          action.type !==
            "replace_file"
      );

    if (
      patchActions.length
    ) {
      results.push(
        await this.executePatchActions(
          patchActions,
          editContext
        )
      );
    }

    for (const action of otherActions) {
      results.push(
        await this.executeAction(
          action,
          editContext
        )
      );
    }

    return results;
  }
}