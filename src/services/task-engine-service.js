import TaskExecutorService from "./task-executor-service.js";

export default class TaskEngineService {
  static handlers = new Map();

  static register(
    type,
    handler
  ) {
    this.handlers.set(
      type,
      handler
    );
  }

  static unregister(
    type
  ) {
    this.handlers.delete(
      type
    );
  }

  static getHandler(
    type
  ) {
    return (
      this.handlers.get(
        type
      ) || null
    );
  }

  static async execute(
    plan,
    context = {}
  ) {
    return TaskExecutorService.execute(
      plan,
      async task =>
        await this.executeTask(
          task,
          plan,
          context
        )
    );
  }

  static async executeNext(
    plan,
    context = {}
  ) {
    return TaskExecutorService.executeNext(
      plan,
      async task =>
        await this.executeTask(
          task,
          plan,
          context
        )
    );
  }

  static async executeTask(
    task,
    plan,
    context
  ) {
    const handler =
      this.getHandler(
        task.type
      );

    if (!handler) {
      throw new Error(
        `No handler registered for task "${task.type}".`
      );
    }

    return await handler(
      task,
      plan,
      context
    );
  }

  static getRegisteredTypes() {
    return Array.from(
      this.handlers.keys()
    );
  }

  static hasHandler(
    type
  ) {
    return this.handlers.has(
      type
    );
  }

  static clear() {
    this.handlers.clear();
  }
}