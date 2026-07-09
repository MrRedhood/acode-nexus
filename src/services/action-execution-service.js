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