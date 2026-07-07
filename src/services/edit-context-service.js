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

    const definition =
      resolved.definition;

    const references =
      resolved.references || [];

    const referenceText =
      references.length
        ? references
            .map(
              ref =>
                `${ref.file}:${ref.line} (${ref.type})`
            )
            .join("\n")
        : "[None]";

    return {
      plan: resolved.plan,

      target,

      definition,

      references,

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

DEFINITION:

${
  definition
    ? `${definition.file}:${definition.line}`
    : "[Unknown]"
}

REFERENCES:

${referenceText}

CODE:

${target.content}

USER REQUEST:

${request}
`
    };
  }
}