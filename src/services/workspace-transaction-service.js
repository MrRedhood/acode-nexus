import PatchService from "./patch-service.js";
import EditorFileService from "./editor-file-service.js";
import SnapshotService from "./snapshot-service.js";

export default class WorkspaceTransactionService {
  static async execute(
    patchSet = [],
    editContext = null
  ) {
    const files =
      this.collectFiles(
        patchSet,
        editContext
      );

    const openedFiles = [];

    try {
      for (const path of files) {
        const openResult =
          await EditorFileService.openFile(
            path
          );

        if (!openResult.success) {
          return {
            success: false,
            error:
              openResult.error
          };
        }

        SnapshotService.save(
          openResult.file
        );

        openedFiles.push(
          openResult.file
        );
      }

      const result =
        await PatchService.applyPatchSet(
          patchSet,
          editContext
        );

      if (result.success) {
        return {
          success: true,
          committed: true,
          results:
            result.results
        };
      }

      this.rollback(
        openedFiles
      );

      return {
        success: false,
        committed: false,
        rollback: true,
        results:
          result.results
      };
    } catch (error) {
      this.rollback(
        openedFiles
      );

      return {
        success: false,
        committed: false,
        rollback: true,
        error:
          error.message
      };
    }
  }

  static rollback(
    files = []
  ) {
    for (const file of files) {
      try {
        SnapshotService.undo(
          file
        );
      } catch (error) {
        console.error(
          "Rollback failed:",
          error
        );
      }
    }
  }

  static collectFiles(
    patchSet = [],
    editContext = null
  ) {
    const files =
      new Set();

    for (const group of patchSet) {
      for (const action of group.actions ||
        []) {
        if (action.file) {
          files.add(
            action.file
          );
        }
      }
    }

    if (
      editContext?.target
        ?.file
    ) {
      files.add(
        editContext.target.file
      );
    }

    return [
      ...files
    ];
  }
}