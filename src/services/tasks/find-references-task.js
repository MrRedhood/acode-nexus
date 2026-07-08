import WorkspaceQueryService from "../services/workspace-query-service.js";

export default class FindReferencesTask {
  static async execute(
    task,
    plan,
    context
  ) {
    console.log(
      "FindReferencesTask"
    );

    const target =
      context?.resolvedTarget ||
      context?.target ||
      context?.editContext
        ?.target;

    if (!target) {
      return {
        success: false,
        error:
          "No resolved target."
      };
    }

    const references =
      await WorkspaceQueryService.findReferences(
        target.name
      );

    context.references =
      references || [];

    return {
      success: true,
      count:
        references.length,
      references
    };
  }
}