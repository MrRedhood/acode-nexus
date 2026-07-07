import LiveBufferSymbolService from "./live-buffer-symbol-service.js";
import WorkspaceSymbolIndexService from "./workspace-symbol-index-service.js";
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
        symbol: null,
        liveBuffer: null,
        file: null,
        path: null,
        source: null
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
        symbol: null,
        liveBuffer,
        file: null,
        path: null,
        source: null
      };
    }

    const currentSymbol =
      LiveBufferSymbolService.findSymbol(
        liveBuffer,
        symbolName
      );

    if (currentSymbol) {
      return {
        plan,

        symbol: currentSymbol,

        liveBuffer,

        file: null,

        path: null,

        source:
          "current-file"
      };
    }

    const indexedSymbol =
      WorkspaceSymbolIndexService.findExact(
        symbolName
      );

    if (!indexedSymbol) {
      return {
        plan,
        symbol: null,
        liveBuffer,
        file: null,
        path: null,
        source: null
      };
    }

    const latestBuffer =
      await SearchService.readFullFile(
        indexedSymbol.path
      );

    if (!latestBuffer) {
      return {
        plan,
        symbol: indexedSymbol,
        liveBuffer: null,
        file:
          indexedSymbol.file,
        path:
          indexedSymbol.path,
        source:
          "workspace"
      };
    }

    const latestSymbol =
      LiveBufferSymbolService.findSymbol(
        latestBuffer,
        symbolName
      );

    return {
      plan,

      symbol:
        latestSymbol ||
        indexedSymbol,

      liveBuffer:
        latestBuffer,

      file:
        indexedSymbol.file,

      path:
        indexedSymbol.path,

      source:
        "workspace"
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