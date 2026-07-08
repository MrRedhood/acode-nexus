import ActionService from "../services/action-service.js";

export default class ApplyActionsTask {
  static async execute(
    task,
    plan,
    context
  ) {
    console.log(
      "ApplyActionsTask"
    );

    const actions =
      plan.actions || [];

    if (!actions.length) {
      return {
        success: false,
        applied: false,
        message:
          "No actions available."
      };
    }

    const results =
      await ActionService.executeActions(
        actions,
        context
      );

    plan.result =
      results;

    return {
      success: true,
      applied: true,
      results
    };
  }
}