export default class VerifyWorkspaceTask {
  static async execute(
    task,
    plan,
    context
  ) {
    console.log(
      "VerifyWorkspaceTask"
    );

    const diagnostics = [];

    if (
      !plan.actions ||
      plan.actions.length === 0
    ) {
      diagnostics.push({
        level: "warning",
        message:
          "No actions were generated."
      });
    }

    if (!plan.result) {
      diagnostics.push({
        level: "warning",
        message:
          "No execution result available."
      });
    }

    if (
      plan.result &&
      Array.isArray(
        plan.result
      )
    ) {
      const failed =
        plan.result.filter(
          result =>
            result &&
            result.success ===
              false
        );

      for (const item of failed) {
        diagnostics.push({
          level: "error",
          message:
            item.error ||
            "Unknown execution error."
        });
      }
    }

    plan.diagnostics =
      diagnostics;

    const hasErrors =
      diagnostics.some(
        item =>
          item.level ===
          "error"
      );

    return {
      success:
        !hasErrors,
      verified:
        !hasErrors,
      diagnostics
    };
  }
}