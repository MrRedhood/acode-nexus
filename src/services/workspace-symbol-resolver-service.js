import LiveBufferSymbolService from "./live-buffer-symbol-service.js";
import WorkspaceSymbolIndexService from "./workspace-symbol-index-service.js";
import WorkspaceQueryService from "./workspace-query-service.js";
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

    if (!symbolName) {
      return {
        plan,
        target: null,
        definition: null,
        references: []
      };
    }

    const definition =
      await WorkspaceQueryService.findDefinition(
        symbolName
      );

    const references =
      await WorkspaceQueryService.findReferences(
        symbolName
      );

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

    const indexedSymbol =
      WorkspaceSymbolIndexService.findExact(
        symbolName
      );

    if (!indexedSymbol) {
      return {
        plan,
        target: null,
        definition,
        references
      };
    }

    const latestBuffer =
      await SearchService.readFullFile(
        indexedSymbol.path
      );

    const buffer =
      latestBuffer || "";

    const latestSymbol =
      LiveBufferSymbolService.findSymbol(
        buffer,
        symbolName
      );

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