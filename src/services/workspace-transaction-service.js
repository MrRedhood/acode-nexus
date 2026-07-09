import PatchService from "./patch-service.js";
import PatchValidatorService from "./patch-validator-service.js";
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

        for (const action of group.actions ||
          []) {
          const validation =
            action.type ===
            "patch_file"
              ? PatchValidatorService.validatePatchAction(
                  action
                )
              : PatchValidatorService.validateAction(
                  action
                );

          if (
            !validation.valid
          ) {
            fileReport.success =
              false;

            report.success =
              false;

            report.errors.push({
              file:
                group.file,
              action:
                action.type,
              error:
                validation.error
            });

            break;
          }

          let result;

          switch (
            action.type
          ) {
            case "patch_file":
              result =
                await PatchService.patchFile(
                  action,
                  editContext
                );
              break;

            case "replace_file":
              result =
                await PatchService.replaceFile(
                  action,
                  editContext
                );
              break;

            case "replace_symbol":
              result =
                await PatchService.replaceSymbol(
                  action,
                  editContext
                );
              break;

            case "undo_file":
              result =
                await PatchService.undoFile(
                  action
                );
              break;

            default:
              result = {
                success: false,
                error:
                  `Unsupported action: ${action.type}`
              };
          }

          fileReport.actions.push(
            result
          );

          if (
            !result.success
          ) {
            fileReport.success =
              false;

            report.success =
              false;

            report.errors.push({
              file:
                group.file,
              action:
                action.type,
              error:
                result.error
            });

            break;
          }
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