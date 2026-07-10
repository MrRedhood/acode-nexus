import PatchService from "./patch-service.js";
import PatchValidatorService from "./patch-validator-service.js";
import ExecutionReportService from "./execution-report-service.js";

export default class PatchExecutionService {
  static async execute(
    action,
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

    ExecutionReportService.addAction(
      report,
      action
    );

    if (action.file) {
      ExecutionReportService.addFile(
        report,
        action.file
      );
    }

    if (action.symbol) {
      ExecutionReportService.addSymbol(
        report,
        action.symbol
      );
    }

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
      ExecutionReportService.addError(
        report,
        validation.error
      );

      ExecutionReportService.finish(
        report,
        false
      );

      return {
        success: false,
        error:
          validation.error,
        report
      };
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

        if (
          editContext?.target
            ?.name
        ) {
          ExecutionReportService.addSymbol(
            report,
            editContext
              .target
              .name
          );
        }

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

    if (
      !result.success
    ) {
      ExecutionReportService.addError(
        report,
        result.error
      );

      ExecutionReportService.finish(
        report,
        false
      );

      return {
        ...result,
        report
      };
    }

    ExecutionReportService.setResult(
      report,
      result
    );

    ExecutionReportService.finish(
      report,
      true
    );

    return {
      ...result,
      report
    };
  }

  static async executeGroup(
    actions = [],
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

    const results = [];

    for (const action of actions) {
      const result =
        await this.execute(
          action,
          editContext
        );

      results.push(result);

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
        ExecutionReportService.finish(
          report,
          false
        );

        return {
          success: false,
          results,
          report
        };
      }
    }

    ExecutionReportService.setResult(
      report,
      results
    );

    ExecutionReportService.finish(
      report,
      true
    );

    return {
      success: true,
      results,
      report
    };
  }
}