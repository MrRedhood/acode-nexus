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
    const strategy =
      editPlan?.strategy ||
      "replace_file";

    const scope =
      editPlan?.scope ||
      "file";

    const addTask = (
      type,
      title,
      payload = {}
    ) => {
      plan.tasks.push({
        id:
          plan.tasks.length +
          1,

        type,

        title,

        payload,

        status:
          "pending",

        completed:
          false,

        result:
          null
      });
    };

    addTask(
      "resolve_target",
      "Resolve workspace target",
      {
        request,
        strategy
      }
    );

    if (
      strategy ===
        "rename_symbol" ||
      strategy ===
        "patch_function" ||
      strategy ===
        "patch_class" ||
      strategy ===
        "replace_file"
    ) {
      addTask(
        "analyze_dependencies",
        "Analyze dependencies",
        {
          strategy
        }
      );
    }

    if (
      strategy ===
        "rename_symbol"
    ) {
      addTask(
        "find_references",
        "Find symbol references",
        {}
      );
    }

    if (
      scope ===
        "workspace"
    ) {
      addTask(
        "impact_analysis",
        "Analyze workspace impact",
        {}
      );
    }

    addTask(
      "generate_actions",
      "Generate Nexus actions",
      {
        strategy
      }
    );

    addTask(
      "preview_changes",
      "Preview changes"
    );

    addTask(
      "apply_actions",
      "Apply changes"
    );

    addTask(
      "verify_workspace",
      "Verify workspace"
    );
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

    task.result =
      error;

    plan.status =
      "failed";

    return true;
  }
}