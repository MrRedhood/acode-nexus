export default class TaskPlanService {
  static createPlan(
    userRequest,
    editPlan = null
  ) {
    const request =
      String(
        userRequest || ""
      ).trim();

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

      scope:
        editPlan?.scope ||
        "file",

      risk:
        editPlan?.risk ||
        "low",

      strategy:
        editPlan?.strategy ||
        "replace_file",

      estimatedFiles: 1,

      estimatedSymbols: 1,

      progress: {
        total: 0,
        completed: 0
      },

      tasks: []
    };

    this.populateTasks(
      plan,
      request,
      editPlan
    );

    plan.progress.total =
      plan.tasks.length;

    return plan;
  }

  static populateTasks(
    plan,
    request,
    editPlan
  ) {
    const add =
      (
        title,
        description,
        type = "edit"
      ) => {
        plan.tasks.push({
          id:
            plan.tasks.length +
            1,

          type,

          title,

          description,

          status:
            "pending",

          completed:
            false,

          result:
            null
        });
      };

    switch (
      editPlan?.strategy
    ) {
      case "rename_symbol":
        add(
          "Locate symbol",
          "Resolve target symbol."
        );

        add(
          "Rename declaration",
          "Rename the primary declaration."
        );

        add(
          "Update references",
          "Update every reference."
        );

        add(
          "Verify workspace",
          "Ensure no broken references remain.",
          "verify"
        );

        plan.estimatedFiles =
          5;

        plan.estimatedSymbols =
          1;
        break;

      case "patch_function":
        add(
          "Locate function",
          "Resolve target function."
        );

        add(
          "Patch function",
          "Apply requested changes."
        );

        add(
          "Verify edit",
          "Ensure edit is correct.",
          "verify"
        );
        break;

      case "patch_class":
        add(
          "Locate class",
          "Resolve target class."
        );

        add(
          "Patch class",
          "Apply requested changes."
        );

        add(
          "Verify edit",
          "Ensure edit is correct.",
          "verify"
        );
        break;

      case "delete":
        add(
          "Locate target",
          "Resolve deletion target."
        );

        add(
          "Delete code",
          "Remove requested code."
        );

        add(
          "Verify workspace",
          "Ensure nothing broke.",
          "verify"
        );
        break;

      case "insert":
        add(
          "Locate insertion point",
          "Find correct location."
        );

        add(
          "Insert code",
          "Insert requested implementation."
        );

        add(
          "Verify edit",
          "Ensure insertion is valid.",
          "verify"
        );
        break;

      default:
        add(
          "Analyze request",
          request,
          "analysis"
        );

        add(
          "Apply edit",
          "Modify code."
        );

        add(
          "Verify changes",
          "Ensure edit is correct.",
          "verify"
        );
    }
  }

  static createTitle(
    request
  ) {
    if (!request) {
      return "Unnamed Task";
    }

    return (
      request.length > 60
        ? request.slice(
            0,
            57
          ) + "..."
        : request
    );
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
    taskId
  ) {
    const task =
      plan.tasks.find(
        t =>
          t.id === taskId
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
    taskId,
    result = null
  ) {
    const task =
      plan.tasks.find(
        t =>
          t.id === taskId
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
      plan.progress.completed ===
      plan.progress.total
    ) {
      plan.status =
        "completed";
    }

    return true;
  }

  static failTask(
    plan,
    taskId,
    error
  ) {
    const task =
      plan.tasks.find(
        t =>
          t.id === taskId
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