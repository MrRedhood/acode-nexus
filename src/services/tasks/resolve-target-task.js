export default class ResolveTargetTask {
  static async execute(
    task,
    plan,
    context
  ) {
    console.log(
      "ResolveTargetTask"
    );

    return {
      success: true,
      resolved: true
    };
  }
}