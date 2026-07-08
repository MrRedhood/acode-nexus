export default class GenerateActionsTask {
  static async execute(
    task,
    plan,
    context
  ) {
    console.log(
      "GenerateActionsTask"
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

    const dependency =
      context.dependency ||
      null;

    const references =
      context.references ||
      [];

    const impact =
      context.impact ||
      {
        scope: "file",
        affectedFiles: [
          {
            file:
              target.path ||
              target.file,
            reasons: [
              "Target"
            ]
          }
        ]
      };

    const actionContext = {
      request:
        plan.description,

      strategy:
        plan.strategy,

      scope:
        impact.scope,

      risk:
        plan.risk,

      target,

      dependency,

      references,

      impact,

      affectedFiles:
        impact.affectedFiles,

      workspace:
        context?.editContext
    };

    context.actionContext =
      actionContext;

    return {
      success: true,

      generated: true,

      actionContext
    };
  }
}