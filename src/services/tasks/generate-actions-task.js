export default class GenerateActionsTask {
  static async execute(
    task,
    plan,
    context
  ) {
    console.log(
      "GenerateActionsTask"
    );

    return {
      success: true,
      generated: true
    };
  }
}