import WorkspaceSymbolResolverService from "./workspace-symbol-resolver-service.js";

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
        context: `
CURRENT FILE:

${liveBuffer}

USER REQUEST:

${request}
`
      };
    }

    const target =
      resolved.target;

    return {
      plan: resolved.plan,

      target,

      context: `
TARGET FILE:

${
  target.file ||
  "[Current File]"
}

SOURCE:

${target.source}

TARGET ${target.symbolType.toUpperCase()}:

${target.name}

LINES:

${target.startLine}-${target.endLine}

CODE:

${target.content}

USER REQUEST:

${request}
`
    };
  }
}