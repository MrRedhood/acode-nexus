import WorkspaceSymbolResolverService from "./workspace-symbol-resolver-service.js";
import DependencyResolverService from "./dependency-resolver-service.js";
import ImpactAnalysisService from "./impact-analysis-service.js";
import WorkspaceContextService from "./workspace-context-service.js";

export default class EditContextService {
  static async prepare(
    plan,
    userRequest,
    liveBuffer
  ) {
    const request =
      String(
        userRequest || ""
      ).trim();

    const workspace =
      await WorkspaceContextService.build();

    const resolved =
      await WorkspaceSymbolResolverService.resolve(
        plan,
        request,
        liveBuffer
      );

    if (
      !resolved.target
    ) {
      return {
        plan,
        request,
        liveBuffer,

        workspace,

        target: null,
        definition: null,
        references: [],
        intent: null,
        confidence: "Unknown",
        dependency: null,
        impact: null
      };
    }

    const target =
      resolved.target;

    const definition =
      resolved.definition;

    const references =
      resolved.references || [];

    const intent =
      resolved.intent;

    const confidence =
      resolved.confidence ??
      "Unknown";

    const dependency =
      DependencyResolverService.resolve(
        target.name
      );

    const impact =
      ImpactAnalysisService.analyze(
        plan,
        target
      );

    return {
      plan:
        resolved.plan,

      request,

      liveBuffer,

      workspace,

      target,

      definition,

      references,

      intent,

      confidence,

      dependency,

      impact
    };
  }
}