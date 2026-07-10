import TaskGraphBuilderService from "./task-graph-builder-service.js";

export default class TaskPlanService {
  static createPlan(
    userRequest,
    editPlan = null
  ) {
    const request =
      String(
        userRequest || ""
      ).trim();

    const strategy =
      editPlan?.strategy ||
      "replace_file";

    const scope =
      editPlan?.scope ||
      "file";

    const plan = {
      id:
        "plan_" +
        Date.now(),

      title:
        this.createTitle(
          request
        ),

      description:
        request,

      createdAt:
        Date.now(),

      status:
        "draft",

      strategy,

      scope,

      risk:
        editPlan?.risk ||
        "low",

      estimatedFiles:
        scope ===
        "workspace"
          ? 5
          : 1,

      estimatedSymbols: 1,

      progress: {
        total: 0,
        completed: 0
      },

      actions: [],

      preview: [],

      diagnostics: [],

      warnings: [],

      result: null,

      tasks: []
    };

    this.buildTasks(
      plan,
      request,
      editPlan
    );

    plan.progress.total =
      plan.tasks.length;

    return plan;
  }

  static buildTasks(
    plan,
    request,
    editPlan
  ) {
    const graph =
      TaskGraphBuilderService.build(
        request,
        editPlan
      );

    for (const node of graph) {
      plan.tasks.push({
        id:
          plan.tasks.length +
          1,

        type:
          node.type,

        title:
          node.title,

        payload:
          node.payload ||
          {},

        status:
          "pending",

        completed:
          false,

        startedAt:
          null,

        completedAt:
          null,

        result:
          null
      });
    }
  }

  static createTitle(
    request
  ) {
    if (!request) {
      return "Unnamed Task";
    }

    return request.length >
      60
      ? request.slice(
          0,
          57
        ) + "..."
      : request;
  }

  static approve(
    plan
  ) {
    plan.status =
      "approved";

    return plan;
  }

  static reject(
    plan
  ) {
    plan.status =
      "rejected";

    return plan;
  }

  static startTask(
    plan,
    id
  ) {
    const task =
      plan.tasks.find(
        t => t.id === id
      );

    if (!task) {
      return false;
    }

    task.status =
      "running";

    task.startedAt =
      Date.now();

    return true;
  }

  static completeTask(
    plan,
    id,
    result = null
  ) {
    const task =
      plan.tasks.find(
        t => t.id === id
      );

    if (!task) {
      return false;
    }

    task.status =
      "completed";

    task.completed =
      true;

    task.completedAt =
      Date.now();

    task.result =
      result;

    plan.progress.completed =
      plan.tasks.filter(
        t => t.completed
      ).length;

    if (
      plan.progress
        .completed ===
      plan.progress.total
    ) {
      plan.status =
        "completed";
    }

    return true;
  }

  static failTask(
    plan,
    id,
    error
  ) {
    const task =
      plan.tasks.find(
        t => t.id === id
      );

    if (!task) {
      return false;
    }

    task.status =
      "failed";

    task.completedAt =
      Date.now();

    task.result =
      error;

    plan.status =
      "failed";

    return true;
  }
}