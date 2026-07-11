import WorkspaceVerificationService from "../services/workspace-verification-service.js";

export default class VerifyWorkspaceTask {
  static async execute(
    task,
    plan,
    context
  ) {
    console.log(
      "VerifyWorkspaceTask"
    );

    const verification =
      WorkspaceVerificationService.verify(
        plan.result,
        context?.changeAnalysis ||
          context?.editContext
            ?.changeAnalysis ||
          null
      );

    plan.verification =
      verification;

    plan.diagnostics =
      [
        ...(verification.errors || []).map(
          error => ({
            level: "error",
            message: error
          })
        ),

        ...(verification.warnings || []).map(
          warning => ({
            level: "warning",
            message: warning
          })
        )
      ];

    if (
      verification.recommendations
        ?.length
    ) {
      plan.warnings = [
        ...(plan.warnings ||
          []),
        ...verification.recommendations
      ];
    }

    return {
      success:
        verification.success,

      verified:
        verification.verified,

      diagnostics:
        plan.diagnostics,

      verification
    };
  }
}