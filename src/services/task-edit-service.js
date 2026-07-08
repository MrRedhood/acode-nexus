import ActionService from "./action-service.js";
import TaskEngineService from "./task-engine-service.js";

export default class TaskEditService {
  static async execute(
    assistantResponse,
    editContext
  ) {
    if (!editContext) {
      return {
        success: false,
        error:
          "No edit context available."
      };
    }

    const plan =
      editContext.taskPlan;

    if (!plan) {
      return {
        success: false,
        error:
          "No task plan available."
      };
    }

    const actions =
      ActionService.parseActions(
        assistantResponse || ""
      );

    plan.actions = actions;

    const result =
      await TaskEngineService.execute(
        plan,
        editContext
      );

    return {
      ...result,
      actions
    };
  }
}