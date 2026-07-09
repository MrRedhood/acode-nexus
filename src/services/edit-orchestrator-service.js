import PatchPlannerService from "./patch-planner-service.js";
import EditContextService from "./edit-context-service.js";
import TaskPlanService from "./task-plan-service.js";
import ActionContextBuilderService from "./action-context-builder-service.js";
import ActionExecutionService from "./action-execution-service.js";

export default class EditOrchestratorService {
  static current =
    null;

  static async prepare(
    userRequest,
    liveBuffer = ""
  ) {
    const plan =
      PatchPlannerService.createPlan(
        userRequest
      );

    const editContext =
      await EditContextService.prepare(
        plan,
        userRequest,
        liveBuffer
      );

    const taskPlan =
      TaskPlanService.create(
        plan,
        editContext
      );

    editContext.taskPlan =
      taskPlan;

    const actionContext =
      ActionContextBuilderService.build(
        editContext
      );

    this.current = {
      request:
        userRequest,

      liveBuffer,

      plan,

      editContext,

      taskPlan,

      actionContext,

      preparedAt:
        Date.now()
    };

    return this.current;
  }

  static async complete(
    assistantResponse
  ) {
    if (
      !this.current
    ) {
      return {
        success: false,
        error:
          "No prepared edit session."
      };
    }

    const result =
      await ActionExecutionService.execute(
        assistantResponse,
        this.current.editContext
      );

    this.clear();

    return result;
  }

  static getContext() {
    return this.current;
  }

  static getEditContext() {
    return this.current
      ?.editContext;
  }

  static getTaskPlan() {
    return this.current
      ?.taskPlan;
  }

  static getActionContext() {
    return this.current
      ?.actionContext;
  }

  static isPrepared() {
    return Boolean(
      this.current
    );
  }

  static clear() {
    this.current =
      null;
  }
}