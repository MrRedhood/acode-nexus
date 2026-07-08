import ActionService from "../../services/action-service.js";
import EditService from "../../services/edit-service.js";
import TaskEngineService from "../../services/task-engine-service.js";

export default class ChatTaskRunner {
  static async execute(
    assistantMessage
  ) {
    const parsedActions =
      ActionService.parseActions(
        assistantMessage.content
      );

    const editContext =
      EditService.getLastEditContext();

    const taskPlan =
      EditService.getLastTaskPlan();

    if (
      !editContext ||
      !taskPlan
    ) {
      return {
        success: false,
        message:
          "Missing edit context or task plan."
      };
    }

    taskPlan.actions =
      parsedActions;

    const results =
      await TaskEngineService.execute(
        taskPlan,
        editContext
      );

    EditService.clearExecutionState();

    console.log(
      "TASK EXECUTION:",
      results
    );

    return results;
  }
}