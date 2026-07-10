import PatchExecutionService from "./patch-execution-service.js";
import ExecutionReportService from "./execution-report-service.js";
import EditorFileService from "./editor-file-service.js";
import SnapshotService from "./snapshot-service.js";

export default class WorkspaceTransactionService {
  static async execute(
    patchSet = [],
    editContext = null
  ) {
    const report =
      ExecutionReportService.create({
        strategy:
          editContext?.plan
            ?.strategy,
        scope:
          editContext?.plan
            ?.scope,
        risk:
          editContext?.plan
            ?.risk
      });

    const files =
      this.collectFiles(
        patchSet,
        editContext
      );

    const openedFiles =
      [];

    const transaction = {
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
          ExecutionReportService.addError(
            report,
            openResult.error
          );

          ExecutionReportService.finish(
            report,
            false
          );

          return {
            success: false,
            committed: false,
            rollback: false,
            error:
              openResult.error,
            report
          };
        }

        SnapshotService.save(
          openResult.file
        );

        openedFiles.push(
          openResult.file
        );

        ExecutionReportService.addFile(
          report,
          path
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
            group.actions ||
              [],
            editContext
          );

        fileReport.actions =
          result.results ||
          [];

        if (
          result.report
        ) {
          ExecutionReportService.merge(
            report,
            result.report
          );
        }

        if (
          !result.success
        ) {
          fileReport.success =
            false;

          transaction.success =
            false;

          const failed =
            result.results?.find(
              r =>
                !r.success
            );

          const error =
            failed?.error ||
            "Unknown execution error";

          transaction.errors.push({
            file:
              group.file,
            error
          });

          ExecutionReportService.addError(
            report,
            error
          );
        }

        transaction.files.push(
          fileReport
        );

        if (
          !transaction.success
        ) {
          break;
        }
      }

      if (
        transaction.success
      ) {
        transaction.committed =
          true;

        ExecutionReportService.setResult(
          report,
          transaction
        );

        ExecutionReportService.finish(
          report,
          true
        );

        return {
          ...transaction,
          report
        };
      }

      this.rollback(
        openedFiles
      );

      transaction.rollback =
        true;

      ExecutionReportService.setRollback(
        report,
        true
      );

      ExecutionReportService.finish(
        report,
        false
      );

      return {
        ...transaction,
        report
      };
    } catch (error) {
      this.rollback(
        openedFiles
      );

      ExecutionReportService.setRollback(
        report,
        true
      );

      ExecutionReportService.addError(
        report,
        error.message
      );

      ExecutionReportService.finish(
        report,
        false
      );

      return {
        success: false,
        committed: false,
        rollback: true,
        files:
          transaction.files,
        errors: [
          ...transaction.errors,
          {
            error:
              error.message
          }
        ],
        warnings:
          transaction.warnings,
        report
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