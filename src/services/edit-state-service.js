import EditOrchestratorService from "./edit-orchestrator-service.js";

export default class EditStateService {
  static getLastEditContext() {
    return EditOrchestratorService.getEditContext();
  }

  static setLastEditContext(
    context
  ) {
    if (
      EditOrchestratorService.current
    ) {
      EditOrchestratorService.current.editContext =
        context;
    }
  }

  static clearLastEditContext() {
    if (
      EditOrchestratorService.current
    ) {
      EditOrchestratorService.current.editContext =
        null;
    }
  }

  static getLastTaskPlan() {
    return EditOrchestratorService.getTaskPlan();
  }

  static setLastTaskPlan(
    plan
  ) {
    if (
      EditOrchestratorService.current
    ) {
      EditOrchestratorService.current.taskPlan =
        plan;
    }
  }

  static clearLastTaskPlan() {
    if (
      EditOrchestratorService.current
    ) {
      EditOrchestratorService.current.taskPlan =
        null;
    }
  }

  static clearExecutionState() {
    EditOrchestratorService.clear();
  }
}