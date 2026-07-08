import DependencyResolverService from "../services/dependency-resolver-service.js";

export default class AnalyzeDependenciesTask {
  static async execute(
    task,
    plan,
    context
  ) {
    console.log(
      "AnalyzeDependenciesTask"
    );

    const target =
      context?.resolvedTarget ||
      context?.target ||
      context?.editContext
        ?.target;

    if (!target) {
      return {
        success: false,
        error:
          "No resolved target."
      };
    }

    const dependency =
      DependencyResolverService.resolve(
        target.name
      );

    if (!dependency) {
      return {
        success: true,
        dependency: null,
        summary:
          "No dependency information found."
      };
    }

    context.dependency =
      dependency;

    return {
      success: true,
      dependency,
      summary:
        dependency.summary
    };
  }
}