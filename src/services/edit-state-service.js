export default class EditStateService {
  static lastEditContext =
    null;

  static lastTaskPlan =
    null;

  static getLastEditContext() {
    return this.lastEditContext;
  }

  static setLastEditContext(
    context
  ) {
    this.lastEditContext =
      context;
  }

  static clearLastEditContext() {
    this.lastEditContext =
      null;
  }

  static getLastTaskPlan() {
    return this.lastTaskPlan;
  }

  static setLastTaskPlan(
    plan
  ) {
    this.lastTaskPlan =
      plan;
  }

  static clearLastTaskPlan() {
    this.lastTaskPlan =
      null;
  }

  static clearExecutionState() {
    this.clearLastEditContext();
    this.clearLastTaskPlan();
  }
}