export default class TaskRecoveryService {
  static canRecover(plan) {
    if (!plan) {
      return false;
    }

    return (
      plan.status === "failed" ||
      plan.status === "approved" ||
      plan.status === "running"
    );
  }

  static recover(plan) {
    if (!this.canRecover(plan)) {
      return {
        success: false,
        error: "Task plan cannot be recovered."
      };
    }

    const pending =
      plan.tasks.filter(
        task =>
          task.status !==
          "completed"
      );

    if (!pending.length) {
      plan.status =
        "completed";

      return {
        success: true,
        completed: true,
        nextTask: null,
        remaining: 0,
        plan
      };
    }

    const nextTask =
      pending[0];

    if (
      nextTask.status ===
      "failed"
    ) {
      nextTask.status =
        "pending";

      nextTask.result =
        null;

      nextTask.startedAt =
        null;

      nextTask.completedAt =
        null;
    }

    plan.status =
      "approved";

    plan.progress.completed =
      plan.tasks.filter(
        task =>
          task.status ===
          "completed"
      ).length;

    return {
      success: true,
      completed: false,
      nextTask,
      remaining:
        pending.length,
      plan
    };
  }

  static retryTask(
    plan,
    taskId
  ) {
    const task =
      plan.tasks.find(
        task =>
          task.id === taskId
      );

    if (!task) {
      return false;
    }

    task.status =
      "pending";

    task.completed =
      false;

    task.result =
      null;

    task.startedAt =
      null;

    task.completedAt =
      null;

    plan.status =
      "approved";

    plan.progress.completed =
      plan.tasks.filter(
        task =>
          task.completed
      ).length;

    return true;
  }

  static restart(plan) {
    if (!plan) {
      return false;
    }

    plan.status =
      "approved";

    plan.progress.completed =
      0;

    for (const task of plan.tasks) {
      task.status =
        "pending";

      task.completed =
        false;

      task.result =
        null;

      task.startedAt =
        null;

      task.completedAt =
        null;
    }

    return true;
  }

  static getNextTask(
    plan
  ) {
    return (
      plan.tasks.find(
        task =>
          task.status !==
          "completed"
      ) || null
    );
  }

  static getRemainingTasks(
    plan
  ) {
    return plan.tasks.filter(
      task =>
        task.status !==
        "completed"
    );
  }

  static hasFailures(
    plan
  ) {
    return plan.tasks.some(
      task =>
        task.status ===
        "failed"
    );
  }

  static isCompleted(
    plan
  ) {
    return plan.tasks.every(
      task =>
        task.status ===
        "completed"
    );
  }
}