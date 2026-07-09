import PatchExecutionService from "./patch-execution-service.js";
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

    const openedFiles =
      [];

    const report = {
      success: true,
      committed: false,
      rollback: false,
      files: [],
      errors: [],
      warnings: []
    };

    try {
      for (const path of files) {
        const openResult =
          await EditorFileService.openFile(
            path
          );

        if (
          !openResult.success
        ) {
          return {
            success: false,
            committed: false,
            rollback: false,
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

      for (const group of patchSet) {
        const fileReport = {
          file:
            group.file,
          success: true,
          actions: []
        };

        const result =
          await PatchExecutionService.executeGroup(
            group.actions || [],
            editContext
          );

        fileReport.actions =
          result.results;

        if (!result.success) {
          fileReport.success =
            false;

          report.success =
            false;

          const failed =
            result.results.find(
              r => !r.success
            );

          report.errors.push({
            file:
              group.file,
            error:
              failed?.error ||
              "Unknown execution error"
          });
        }

        report.files.push(
          fileReport
        );

        if (
          !report.success
        ) {
          break;
        }
      }

      if (
        report.success
      ) {
        report.committed =
          true;

        return report;
      }

      this.rollback(
        openedFiles
      );

      report.rollback =
        true;

      return report;
    } catch (error) {
      this.rollback(
        openedFiles
      );

      return {
        success: false,
        committed: false,
        rollback: true,
        files:
          report.files,
        errors: [
          ...report.errors,
          {
            error:
              error.message
          }
        ],
        warnings:
          report.warnings
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
        if (
          action.file
        ) {
          files.add(
            action.file
          );
        }
      }
    }

    if (
      editContext
        ?.target?.file
    ) {
      files.add(
        editContext
          .target.file
      );
    }

    return [
      ...files
    ];
  }
}