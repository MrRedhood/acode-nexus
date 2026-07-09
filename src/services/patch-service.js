import EditorFileService from "./editor-file-service.js";
import EditorContentService from "./editor-content-service.js";
import SnapshotService from "./snapshot-service.js";

export default class PatchService {
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
        EditorFileService.findOpenFile(
          action.file
        );

      if (!file) {
        const openResult =
          await EditorFileService.openFile(
            action.file
          );

        if (!openResult.success) {
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

      EditorFileService.switchTo(
        file
      );

      SnapshotService.save(
        file
      );

      EditorContentService.setContent(
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
        error:
          error.message
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
        EditorFileService.findOpenFile(
          action.file
        );

      if (!file) {
        const openResult =
          await EditorFileService.openFile(
            action.file
          );

        if (!openResult.success) {
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

      EditorFileService.switchTo(
        file
      );

      SnapshotService.save(
        file
      );

      const result =
        EditorContentService.replace(
          file,
          action.search,
          action.replace
        );

      return result.success
        ? {
            success: true
          }
        : result;
    } catch (error) {
      console.error(
        "patchFile failed:",
        error
      );

      return {
        success: false,
        error:
          error.message
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
        EditorFileService.findOpenFile(
          target.file ||
            action.file
        );

      if (!file) {
        const openResult =
          await EditorFileService.openFile(
            target.file ||
              action.file
          );

        if (!openResult.success) {
          return openResult;
        }

        file =
          openResult.file;
      }

      if (!file) {
        return {
          success: false,
          error:
            "Unable to open target file."
        };
      }

      if (
        !target.content
      ) {
        return {
          success: false,
          error:
            "Target symbol content missing."
        };
      }

      EditorFileService.switchTo(
        file
      );

      SnapshotService.save(
        file
      );

      const result =
        EditorContentService.replaceExact(
          file,
          target.content,
          action.content
        );

      if (!result.success) {
        return {
          success: false,
          error:
            "Resolved symbol no longer matches file."
        };
      }

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

  static async undoFile(
    action
  ) {
    try {
      let file =
        EditorFileService.findOpenFile(
          action.file
        );

      if (!file) {
        const openResult =
          await EditorFileService.openFile(
            action.file
          );

        if (!openResult.success) {
          return openResult;
        }

        file =
          openResult.file;
      }

      const result =
        SnapshotService.undo(
          file
        );

      if (
        result.success
      ) {
        EditorFileService.switchTo(
          file
        );
      }

      return result;
    } catch (error) {
      console.error(
        "undoFile failed:",
        error
      );

      return {
        success: false,
        error:
          error.message
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

        switch (action.type) {
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

        if (!result.success) {
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
        result =>
          result.success
      ),
      results
    };
  }
}