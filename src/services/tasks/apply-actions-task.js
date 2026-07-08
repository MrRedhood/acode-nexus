export default class ApplyActionsTask {
  static async execute(
    task,
    plan,
    context
  ) {
    console.log(
      "ApplyActionsTask"
    );

    return {
      success: true,
      applied: true
    };
  }
}