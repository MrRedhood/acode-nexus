import SearchService from "./search-service.js";

export default class ActionService {
  static snapshots = new Map();
  static MAX_HISTORY = 20;

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

        console.log("ACTION JSON:", json);

        const action = JSON.parse(json);
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
    if (!action) return false;
    if (!action.type) return false;

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
        typeof action.content === "string"
      );
    }

    if (
      action.type === "patch_file"
    ) {
      return (
        !!action.file &&
        typeof action.search === "string" &&
        typeof action.replace === "string"
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

    const target = normalize(filename);
    const targetBase =
      target.split("/").pop();

    return (
      editorManager.files.find(file => {
        const name = normalize(
          file.filename || file.name
        );

        const uri = normalize(file.uri);
        const uriBase =
          uri.split("/").pop();

        return (
          name === target ||
          name === targetBase ||
          uri === target ||
          uri.includes(target) ||
          uriBase === targetBase
        );
      }) || null
    );
  }

  static saveSnapshot(file) {
    if (!file || !file.session) {
      return;
    }

    const key =
      file.filename ||
      file.name ||
      file.uri;

    const content =
      file.session.getValue();

    let history =
      this.snapshots.get(key) || [];

    if (
      history.length &&
      history[
        history.length - 1
      ] === content
    ) {
      return;
    }

    history.push(content);

    if (
      history.length >
      this.MAX_HISTORY
    ) {
      history.shift();
    }

    this.snapshots.set(key, history);
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
        editorManager.editor?.gotoLine
      ) {
        setTimeout(() => {
          try {
            editorManager.editor.gotoLine(
              action.line
            );
          } catch (error) {
            console.error(error);
          }
        }, 150);
      }

      return { success: true };
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
          error: "File not found"
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

  static async replaceFile(action) {
    try {
      let file =
        this.findOpenEditorFile(
          action.file
        );

      if (!file) {
        const openResult =
          await this.openFile({
            file: action.file
          });

        if (!openResult.success) {
          return openResult;
        }

        file = openResult.file;
      }

      if (!file) {
        return {
          success: false,
          error:
            "Unable to open file"
        };
      }

      editorManager.switchFile(
        file.id
      );

      this.saveSnapshot(file);

      file.session.setValue(
        action.content
      );

      return { success: true };
    } catch (error) {
      console.error(
        "replaceFile failed:",
        error
      );

      return {
        success: false,
        error: error.message
      };
    }
  }

  static async patchFile(action) {
    try {
      let file =
        this.findOpenEditorFile(
          action.file
        );

      console.log(
        "PATCH FILE DEBUG:",
        {
          found: !!file,
          name: file?.name,
          uri: file?.uri,
          activeName:
            editorManager.activeFile?.name,
          sameObject:
            file ===
            editorManager.activeFile
        }
      );

      if (!file) {
        const openResult =
          await this.openFile({
            file: action.file
          });

        if (!openResult.success) {
          return openResult;
        }

        file = openResult.file;
      }

      if (!file) {
        return {
          success: false,
          error:
            "Unable to open file"
        };
      }

      const currentContent =
        file.session.getValue();

      console.log(
        "PATCH TARGET START:",
        JSON.stringify(
          currentContent.slice(0, 200)
        )
      );

      console.log(
        "SEARCH TEXT:",
        JSON.stringify(
          action.search
        )
      );

      if (
        !currentContent.includes(
          action.search
        )
      ) {
        return {
          success: false,
          error:
            "Search text not found"
        };
      }

      const occurrences =
        currentContent.split(
          action.search
        ).length - 1;

      if (occurrences > 1) {
        return {
          success: false,
          error:
            "Search text appears multiple times"
        };
      }

      const patchedContent =
        currentContent.replace(
          action.search,
          action.replace
        );

      editorManager.switchFile(
        file.id
      );

      console.log(
        "PATCH ACTIVE CHECK",
        {
          activeId:
            editorManager.activeFile?.id,
          fileId: file.id,
          same:
            editorManager.activeFile?.id ===
            file.id
        }
      );

      this.saveSnapshot(file);

      file.session.setValue(
        patchedContent
      );

      console.log(
        "AFTER PATCH ACTIVE VALUE START:",
        editorManager.activeFile
          ?.session
          ?.getValue()
          ?.slice(0, 100)
      );

      return { success: true };
    } catch (error) {
      console.error(
        "patchFile failed:",
        error
      );

      return {
        success: false,
        error: error.message
      };
    }
  }

  static async undoFile(action) {
    try {
      let file =
        this.findOpenEditorFile(
          action.file
        );

      if (!file) {
        const openResult =
          await this.openFile({
            file: action.file
          });

        if (!openResult.success) {
          return openResult;
        }

        file = openResult.file;
      }

      const key =
        file.filename ||
        file.name ||
        file.uri;

      const history =
        this.snapshots.get(key);

      if (
        !history ||
        !history.length
      ) {
        return {
          success: false,
          error:
            "No snapshot found"
        };
      }

      const snapshot =
        history.pop();

      file.session.setValue(
        snapshot
      );

      if (
        history.length === 0
      ) {
        this.snapshots.delete(
          key
        );
      } else {
        this.snapshots.set(
          key,
          history
        );
      }

      editorManager.switchFile(
        file.id
      );

      return { success: true };
    } catch (error) {
      console.error(
        "undoFile failed:",
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
        return await this.replaceFile(
          action
        );

      case "patch_file":
        return await this.patchFile(
          action
        );

      case "undo_file":
        return await this.undoFile(
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