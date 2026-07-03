import SearchService from "./search-service.js";

export default class ActionService {
  static SUPPORTED_ACTIONS = [
    "focus_file",
    "open_file",
    "replace_file"
  ];

  static parseActions(text) {
    if (!text) {
      return [];
    }

    const matches =
      text.match(
        /```nexus-action\s*([\s\S]*?)```/g
      ) || [];

    const actions = [];

    matches.forEach(block => {
      try {
        const json =
          block
            .replace(
              /```nexus-action/,
              ""
            )
            .replace(
              /```$/,
              ""
            )
            .trim();

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
        "open_file"
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

    return true;
  }

  static findOpenEditorFile(
    filename
  ) {
    if (
      !filename ||
      !editorManager ||
      !editorManager.files
    ) {
      return null;
    }

    const lower =
      filename.toLowerCase();

    return (
      editorManager.files.find(
        file => {
          const name =
            (
              file.filename ||
              file.name ||
              ""
            ).toLowerCase();

          const uri =
            (
              file.uri || ""
            ).toLowerCase();

          return (
            name === lower ||
            name.includes(lower) ||
            uri.includes(lower)
          );
        }
      ) || null
    );
  }

  static async focusFile(
    action
  ) {
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
        error:
          error.message
      };
    }
  }

  static async openFile(
    action
  ) {
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
            uri: file.path,
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
        error:
          error.message
      };
    }
  }

  static async replaceFile(
    action
  ) {
    try {
      let file =
        this.findOpenEditorFile(
          action.file
        );

      if (!file) {
        const openResult =
          await this.openFile(
            {
              file:
                action.file
            }
          );

        if (
          !openResult.success
        ) {
          return openResult;
        }

        file =
          openResult.file;
      }

      if (!file) {
        return {
          success: false,
          error:
            "Unable to open file"
        };
      }

      file.session.setValue(
        action.content
      );

      editorManager.switchFile(
        file.id
      );

      return {
        success: true
      };
    } catch (error) {
      console.error(
        "replaceFile failed:",
        error
      );

      return {
        success: false,
        error:
          error.message
      };
    }
  }

  static async executeAction(
    action
  ) {
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
        return await this.focusFile(
          action);

      case "open_file":
        return await this.openFile(
          action);

      case "replace_file":
        return await this.replaceFile(
          action);

      default:
        return {
          success: false,
          error:
            "Unsupported action"
        };
    }
  }
}