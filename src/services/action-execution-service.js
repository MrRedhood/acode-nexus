import ActionParserService from "./action-parser-service.js";
import WorkspaceTransactionService from "./workspace-transaction-service.js";

export default class ActionExecutionService {
  static async execute(
    response,
    editContext = null
  ) {
    const parsed =
      ActionParserService.parseActions(
        response
      );

    if (
      !parsed.success
    ) {
      return {
        success: false,
        stage: "parse",
        error:
          parsed.error
      };
    }

    const patchSet =
      this.buildPatchSet(
        parsed.actions
      );

    if (
      !patchSet.length
    ) {
      return {
        success: false,
        stage: "build",
        error:
          "No executable actions."
      };
    }

    const result =
      await WorkspaceTransactionService.execute(
        patchSet,
        editContext
      );

    return {
      ...result,
      stage:
        result.success
          ? "completed"
          : "execution",
      actions:
        parsed.actions,
      patchSet
    };
  }

  static buildPatchSet(
    actions = []
  ) {
    const groups =
import ActionParserService from "./action-parser-service.js";
import WorkspaceTransactionService from "./workspace-transaction-service.js";
import ExecutionReportService from "./execution-report-service.js";

export default class ActionExecutionService {
  static async execute(
    response,
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

    const parsed =
      ActionParserService.parseActions(
        response
      );

    if (
      !parsed.success
    ) {
      ExecutionReportService.addError(
        report,
        parsed.error
      );

      ExecutionReportService.finish(
        report,
        false
      );

      return {
        success: false,
        stage: "parse",
        error:
          parsed.error,
        report
      };
    }

    for (const action of parsed.actions) {
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
    }

    const patchSet =
      this.buildPatchSet(
        parsed.actions
      );

    if (
      !patchSet.length
    ) {
      ExecutionReportService.addError(
        report,
        "No executable actions."
      );

      ExecutionReportService.finish(
        report,
        false
      );

      return {
        success: false,
        stage: "build",
        error:
          "No executable actions.",
        report
      };
    }

    const result =
      await WorkspaceTransactionService.execute(
        patchSet,
        editContext
      );

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
      if (result.errors) {
        for (const error of result.errors) {
          ExecutionReportService.addError(
            report,
            error
          );
        }
      }

      ExecutionReportService.finish(
        report,
        false
      );

      return {
        ...result,
        stage:
          "execution",
        actions:
          parsed.actions,
        patchSet,
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
      stage:
        "completed",
      actions:
        parsed.actions,
      patchSet,
      report
    };
  }

  static buildPatchSet(
    actions = []
  ) {
    const groups =
      new Map();

    for (const action of actions) {
      const file =
        action.file ||
        "__workspace__";

      if (
        !groups.has(file)
      ) {
        groups.set(
          file,
          {
            file,
            actions: []
          }
        );
      }

      groups
        .get(file)
        .actions.push(
          action
        );
    }

    return [
      ...groups.values()
    ];
  }

  static async executeAction(
    action,
    editContext = null
  ) {
    return await this.execute(
      `\`\`\`nexus-action
${JSON.stringify(
        action,
        null,
        2
      )}
\`\`\``,
      editContext
    );
  }

  static canExecute(
    response
  ) {
    return ActionParserService.isActionResponse(
      response
    );
  }
}