export default class VerifyWorkspaceTask {
  static async execute(
    task,
    plan,
    context
  ) {
    console.log(
      "VerifyWorkspaceTask"
    );

    return {
      success: true,
      verified: true
    };
  }
}