import TaskPlanService from "./task-plan-service.js";

export default class TaskExecutorService {
  static async execute(
    plan,
    executor
  ) {
    if (!plan) {
      return {
        success: false,
        error: "No task plan."
      };
    }

    if (
      typeof executor !==
      "function"
    ) {
      return {
        success: false,
        error:
          "No executor supplied."
      };
    }

    if (
      plan.status ===
      "draft"
    ) {
      TaskPlanService.approve(
        plan
      );
    }

    for (const task of plan.tasks) {
      if (
        task.completed
      ) {
        continue;
      }

      TaskPlanService.startTask(
        plan,
        task.id
      );

      try {
        const result =
          await executor(
            task,
            plan
          );

        TaskPlanService.completeTask(
          plan,
          task.id,
          result
        );
      } catch (error) {
        TaskPlanService.failTask(
          plan,
          task.id,
          error?.message ||
            String(error)
        );

        return {
          success: false,
          task,
          error:
            error?.message ||
            String(error),
          plan
        };
      }
    }

    return {
      success: true,
      plan
    };
  }

  static async executeNext(
    plan,
    executor
  ) {
    const task =
      plan.tasks.find(
        task =>
          !task.completed
      );

    if (!task) {
      plan.status =
        "completed";

      return {
        success: true,
        completed: true,
        plan
      };
    }

    TaskPlanService.startTask(
      plan,
      task.id
    );

    try {
      const result =
        await executor(
          task,
          plan
        );

      TaskPlanService.completeTask(
        plan,
        task.id,
        result
      );

      return {
        success: true,
        task,
        result,
        completed:
          plan.progress
            .completed ===
          plan.progress
            .total,
        plan
      };
    } catch (error) {
      TaskPlanService.failTask(
        plan,
        task.id,
        error?.message ||
          String(error)
      );

      return {
        success: false,
        task,
        error:
          error?.message ||
          String(error),
        plan
      };
    }
  }

  static getPendingTasks(
    plan
  ) {
    return plan.tasks.filter(
      task =>
        !task.completed
    );
  }

  static getCompletedTasks(
    plan
  ) {
    return plan.tasks.filter(
      task =>
        task.completed
    );
  }

  static getFailedTasks(
    plan
  ) {
    return plan.tasks.filter(
      task =>
        task.status ===
        "failed"
    );
  }

  static getProgress(
    plan
  ) {
    return {
      completed:
        plan.progress
          .completed,
      total:
        plan.progress
          .total,
      percentage:
        plan.progress
          .total === 0
          ? 0
          : Math.round(
              plan.progress
                .completed *
                100 /
                plan.progress
                  .total
            )
    };
  }

  static reset(
    plan
  ) {
    plan.status =
      "approved";

    plan.progress
      .completed = 0;

    for (const task of plan.tasks) {
      task.status =
        "pending";

      task.completed =
        false;

      task.result =
        null;
    }

    return plan;
  }
}