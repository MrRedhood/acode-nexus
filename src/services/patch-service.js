import SearchService from "./search-service.js";

export default class PatchService {
  static snapshots = new Map();

  static MAX_HISTORY = 20;

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

  static async openFile(filename) {
    try {
      const alreadyOpen =
        this.findOpenEditorFile(
          filename
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
          filename
        );

      if (!file) {
        return {
          success: false,
          error: "File not found"
        };
      }

      const content =
        await SearchService.readFullFile(
          filename
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

  static isActiveFile(file) {
    return (
      editorManager?.activeFile?.id ===
      file?.id
    );
  }

  static getFileContent(file) {
    if (!file) {
      return "";
    }

    if (
      this.isActiveFile(file) &&
      editorManager?.editor?.state?.doc
    ) {
      return editorManager.editor
        .state.doc
        .toString();
    }

    return (
      file.session?.getValue?.() || ""
    );
  }

  static setFileContent(
    file,
    content
  ) {
    if (!file) {
      return;
    }

    if (
      this.isActiveFile(file) &&
      editorManager?.editor?.dispatch &&
      editorManager?.editor?.state?.doc
    ) {
      editorManager.editor.dispatch({
        changes: {
          from: 0,
          to:
            editorManager.editor
              .state.doc.length,
          insert: content
        }
      });

      return;
    }

    file.session?.setValue?.(
      content
    );
  }

  static saveSnapshot(file) {
    if (!file) {
      return;
    }

    const key =
      file.filename ||
      file.name ||
      file.uri;

    const content =
      this.getFileContent(file);

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

  static async replaceFile(
  action,
  editContext = null
) {
    try {
      console.log(
  "PATCH CONTEXT:",
  editContext
);
      let file =
        this.findOpenEditorFile(
          action.file
        );

      if (!file) {
        const openResult =
          await this.openFile(
            action.file
          );

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
      this.setFileContent(
        file,
        action.content
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
        error: error.message
      };
    }
  }

  static async patchFile(
  action,
  editContext = null
) {
    try {
      console.log(
  "PATCH CONTEXT:",
  editContext
);
      let file =
        this.findOpenEditorFile(
          action.file
        );

      if (!file) {
        const openResult =
          await this.openFile(
            action.file
          );

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
        this.getFileContent(file);

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

      this.saveSnapshot(file);

      this.setFileContent(
        file,
        patchedContent
      );

      return {
        success: true
      };
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

  static async replaceSymbol(
  action,
  editContext = null
) {
  try {
    if (
      !editContext ||
      !editContext.target
    ) {
      return {
        success: false,
        error:
          "No resolved symbol context."
      };
    }

    const target =
      editContext.target;

    let file =
      this.findOpenEditorFile(
        target.file ||
          action.file
      );

    if (!file) {
      const openResult =
        await this.openFile(
          target.file ||
            action.file
        );

        if (!openResult.success) {
          return openResult;
        }

        file = openResult.file;
    }

    if (!file) {
      return {
        success: false,
        error:
          "Unable to open target file."
      };
    }

    const currentContent =
      this.getFileContent(file);

    const original =
      target.content;

    if (!original) {
      return {
        success: false,
        error:
          "Target symbol content missing."
      };
    }

    if (
      !currentContent.includes(
        original
      )
    ) {
      return {
        success: false,
        error:
          "Resolved symbol no longer matches file."
      };
    }

    editorManager.switchFile(
      file.id
    );

    this.saveSnapshot(file);

    const updated =
      currentContent.replace(
        original,
        action.content
      );

    this.setFileContent(
      file,
      updated
    );

    return {
      success: true
    };
  } catch (error) {
    console.error(
      "replaceSymbol failed:",
      error
    );

    return {
      success: false,
      error:
        error.message
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
          await this.openFile(
            action.file
          );

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

      this.setFileContent(
        file,
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

      return {
        success: true
      };
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

  static async applyPatchSet(
  patchSet = [],
  editContext = null
) {
    const results = [];

    for (const fileSet of patchSet) {
      const fileResult = {
        file: fileSet.file,
        actions: [],
        success: true
      };

      for (const action of fileSet.actions) {
        let result;

        switch (
          action.type
        ) {
          case "patch_file":
            result =
              await this.patchFile(
  action,
  editContext
);
            break;

          case "replace_file":
            result =
              await this.replaceFile(
  action,
  editContext
);
            break;

            case "replace_symbol":
  result =
    await this.replaceSymbol(
      action,
      editContext
    );
  break;

          default:
            result = {
              success: false,
              error:
                `Unsupported action: ${action.type}`
            };
        }

        fileResult.actions.push(
          result
        );

        if (
          !result.success
        ) {
          fileResult.success =
            false;

          break;
        }
      }

      results.push(
        fileResult
      );
    }

    return {
      success: results.every(
        item =>
          item.success
      ),
      results
    };
  }
}