import SearchService from "./search-service.js";
import PatchService from "./patch-service.js";

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
          .replace(/```nexus-action/, "")
          .replace(/```$/, "")
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
      action.type === "focus_file" ||
      action.type === "open_file" ||
      action.type === "undo_file"
    ) {
      return !!action.file;
    }

    if (
      action.type === "replace_file"
    ) {
      return (
        !!action.file &&
        typeof action.content ===
          "string"
      );
    }

    if (
      action.type === "patch_file"
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

  static findOpenEditorFile(filename) {
    if (
      !filename ||
      !editorManager ||
      !editorManager.files
    ) {
      return null;
    }

    const normalize = value =>
      String(value || "")
        .trim()
        .replace(/\\/g, "/")
        .toLowerCase();

    const target =
      normalize(filename);

    const targetBase =
      target.split("/").pop();

    return (
      editorManager.files.find(
        file => {
          const name =
            normalize(
              file.filename ||
                file.name
            );

          const uri =
            normalize(file.uri);

          const uriBase =
            uri.split("/").pop();

          return (
            name === target ||
            name === targetBase ||
            uri === target ||
            uri.includes(target) ||
            uriBase === targetBase
          );
        }
      ) || null
    );
  }

  static async focusFile(action) {
    try {
      const file =
        this.findOpenEditorFile(
          action.file
        );

      if (!file) {
        return {
          success: false,
          error:
            "File is not open in editor"
        };
      }

      editorManager.switchFile(
        file.id
      );

      if (
        action.line &&
        editorManager.editor
          ?.gotoLine
      ) {
        setTimeout(() => {
          try {
            editorManager.editor.gotoLine(
              action.line
            );
          } catch (error) {
            console.error(
              error
            );
          }
        }, 150);
      }

      return {
        success: true
      };
    } catch (error) {
      console.error(
        "focusFile failed:",
        error
      );

      return {
        success: false,
        error: error.message
      };
    }
  }

  static async openFile(action) {
    try {
      const alreadyOpen =
        this.findOpenEditorFile(
          action.file
        );

      if (alreadyOpen) {
        editorManager.switchFile(
          alreadyOpen.id
        );

        return {
          success: true,
          reused: true,
          file: alreadyOpen
        };
      }

      const file =
        SearchService.openFile(
          action.file
        );

      if (!file) {
        return {
          success: false,
          error:
            "File not found"
        };
      }

      const content =
        await SearchService.readFullFile(
          action.file
        );

      if (!content) {
        return {
          success: false,
          error:
            "Could not read file"
        };
      }

      const EditorFile =
        editorManager.files[0]
          .constructor;

      const openedFile =
        new EditorFile(
          file.name,
          {
            uri:
              file.url ||
              file.path,
            text: content,
            editable: true
          }
        );

      return {
        success: true,
        file: openedFile
      };
    } catch (error) {
      console.error(
        "openFile failed:",
        error
      );

      return {
        success: false,
        error: error.message
      };
    }
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
        return await this.focusFile(
          action
        );

      case "open_file":
        return await this.openFile(
          action
        );

      case "replace_file":
        return await PatchService.replaceFile(
          action
        );

      case "patch_file":
        return await PatchService.patchFile(
          action
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
}