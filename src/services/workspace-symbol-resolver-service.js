import LiveBufferSymbolService from "./live-buffer-symbol-service.js";
import WorkspaceSymbolIndexService from "./workspace-symbol-index-service.js";
import WorkspaceQueryService from "./workspace-query-service.js";
import WorkspaceIntentResolverService from "./workspace-intent-resolver-service.js";
import SearchService from "./search-service.js";

export default class WorkspaceSymbolResolverService {
  static async resolve(
    plan,
    userRequest,
    liveBuffer
  ) {
    if (!plan) {
      return {
        plan: null,
        target: null,
        definition: null,
        references: []
      };
    }

    const symbolName =
      this.extractSymbolName(
        plan,
        userRequest
      );

    let definition = null;
    let references = [];

    if (symbolName) {
      definition =
        await WorkspaceQueryService.findDefinition(
          symbolName
        );

      references =
        await WorkspaceQueryService.findReferences(
          symbolName
        );
    }

    if (symbolName) {
      const currentSymbol =
        LiveBufferSymbolService.findSymbol(
          liveBuffer,
          symbolName
        );

      if (currentSymbol) {
        return {
          plan,
          definition,
          references,
          target: {
            source:
              "current-file",

            file: null,

            path: null,

            liveBuffer,

            symbolType:
              currentSymbol.type,

            name:
              currentSymbol.name,

            startLine:
              currentSymbol.startLine,

            endLine:
              currentSymbol.endLine,

            content:
              currentSymbol.content
          }
        };
      }
    }

    if (symbolName) {
      const indexedSymbol =
        WorkspaceSymbolIndexService.findExact(
          symbolName
        );

      if (indexedSymbol) {
        return await this.resolveWorkspaceSymbol(
          plan,
          definition,
          references,
          indexedSymbol
        );
      }
    }

    const intent =
      await WorkspaceIntentResolverService.resolve(
        userRequest
      );

    if (
      !intent ||
      !intent.candidates ||
      !intent.candidates.length
    ) {
      return {
        plan,
        target: null,
        definition,
        references
      };
    }

    for (const candidate of intent.candidates) {
      if (
        candidate.type !==
        "symbol"
      ) {
        continue;
      }

      const result =
        await this.resolveWorkspaceSymbol(
          plan,
          definition,
          references,
          candidate.result
        );

      if (
        result.target
      ) {
        result.intent =
          intent;

        result.confidence =
          candidate.score;

        return result;
      }
    }

    for (const candidate of intent.candidates) {
      if (
        candidate.type ===
        "file"
      ) {
        const buffer =
          await SearchService.readFullFile(
            candidate.result.path
          );

        return {
          plan,

          definition,

          references,

          intent,

          confidence:
            candidate.score,

          target: {
            source:
              "workspace",

            file:
              candidate.result.name,

            path:
              candidate.result.path,

            liveBuffer:
              buffer,

            symbolType:
              "file",

            name:
              candidate.result.name,

            startLine: 1,

            endLine:
              buffer
                ? buffer.split("\n")
                    .length
                : 1,

            content:
              buffer || ""
          }
        };
      }
    }

    return {
      plan,
      target: null,
      definition,
      references,
      intent
    };
  }

  static async resolveWorkspaceSymbol(
    plan,
    definition,
    references,
    indexedSymbol
  ) {
    const latestBuffer =
      await SearchService.readFullFile(
        indexedSymbol.path
      );

    const latestSymbol =
      latestBuffer
        ? LiveBufferSymbolService.findSymbol(
            latestBuffer,
            indexedSymbol.name
          )
        : null;

    const symbol =
      latestSymbol ||
      indexedSymbol;

    return {
      plan,

      definition,

      references,

      target: {
        source:
          "workspace",

        file:
          indexedSymbol.file,

        path:
          indexedSymbol.path,

        liveBuffer:
          latestBuffer,

        symbolType:
          symbol.type,

        name:
          symbol.name,

        startLine:
          symbol.startLine,

        endLine:
          symbol.endLine,

        content:
          symbol.content
      }
    };
  }

  static extractSymbolName(
    plan,
    request
  ) {
    request =
      String(
        request || ""
      );

    switch (
      plan.strategy
    ) {
      case "rename_symbol": {
        const match =
          request.match(
            /rename\s+([A-Za-z_$][A-Za-z0-9_$]*)\s+to\s+/i
          );

        return match
          ? match[1]
          : null;
      }

      case "patch_function":
      case "patch_class":
      case "delete":
      case "insert": {
        const tokens =
          request.match(
            /[A-Za-z_$][A-Za-z0-9_$]*/g
          ) || [];

        const keywords =
          new Set([
            "fix",
            "rename",
            "replace",
            "rewrite",
            "modify",
            "change",
            "update",
            "insert",
            "delete",
            "remove",
            "add",
            "optimize",
            "improve",
            "refactor",
            "function",
            "class",
            "method",
            "variable",
            "to"
          ]);

        for (const token of tokens) {
          if (
            !keywords.has(
              token.toLowerCase()
            )
          ) {
            return token;
          }
        }

        return null;
      }

      default:
        return null;
    }
  }
}