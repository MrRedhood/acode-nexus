import WorkspaceSymbolResolverService from "./workspace-symbol-resolver-service.js";
import DependencyResolverService from "./dependency-resolver-service.js";

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
CURRENT FILE

${liveBuffer}

USER REQUEST

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

    const intent =
      resolved.intent;

    const confidence =
      resolved.confidence ??
      "Unknown";

    const dependency =
      DependencyResolverService.resolve(
        target.name
      );

    const referenceText =
      references.length
        ? references
            .slice(0, 20)
            .map(
              ref =>
                `${ref.file}:${ref.line} (${ref.type})`
            )
            .join("\n")
        : "[None]";

    const keywordText =
      intent?.keywords?.length
        ? intent.keywords.join(
            ", "
          )
        : "[None]";

    const candidateText =
      intent?.candidates?.length
        ? intent.candidates
            .slice(0, 5)
            .map(
              candidate =>
                `${candidate.score} | ${candidate.type} | ${
                  candidate.result.path ||
                  candidate.result.file ||
                  candidate.result.name
                }`
            )
            .join("\n")
        : "[None]";

    const dependencyText =
      dependency?.summary ||
      "[No dependency information available]";

    return {
      plan: resolved.plan,

      target,

      definition,

      references,

      intent,

      dependency,

      context: `
PRIMARY TARGET

FILE:
${
  target.file ||
  "[Current File]"
}

PATH:
${
  target.path ||
  "[Current File]"
}

SOURCE:
${target.source}

CONFIDENCE:
${confidence}

TARGET SYMBOL

TYPE:
${target.symbolType}

NAME:
${target.name}

LINES:
${target.startLine}-${target.endLine}

DEFINITION

${
  definition
    ? `${definition.file}:${definition.line}`
    : "[Unknown]"
}

WORKSPACE REFERENCES

${referenceText}

INTENT ANALYSIS

KEYWORDS:
${keywordText}

TOP CANDIDATES

${candidateText}

DEPENDENCY GRAPH

${dependencyText}

TARGET CODE

${target.content}

USER REQUEST

${request}

INSTRUCTIONS

- Modify only what is necessary.
- Preserve formatting and coding style.
- Do not rewrite unrelated code.
- Use the dependency graph to understand architectural impact.
- Update related files only if required.
- If other files must also change, return Nexus actions for them.
`
    };
  }
}