export default class ActionService {
  static SUPPORTED_ACTIONS = [
    "focus_file"
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

  static validateAction(
    action
  ) {
    if (!action) {
      return false;
    }

    if (
      !action.type
    ) {
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
      "focus_file"
    ) {
      return !!action.file;
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

          return (
            name === lower ||
            name.includes(
              lower
            )
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