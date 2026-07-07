import LiveBufferSymbolService from "./live-buffer-symbol-service.js";

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

    switch (
      plan?.strategy
    ) {
      case "rename_symbol":
        return this.prepareRename(
          request,
          liveBuffer
        );

      case "patch_function":
      case "patch_class":
      case "insert":
      case "delete":
        return this.prepareFocusedEdit(
          plan,
          request,
          liveBuffer
        );

      default:
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
  }

  static prepareRename(
    userRequest,
    liveBuffer
  ) {
    const rename =
      userRequest.match(
        /rename\s+([A-Za-z0-9_$]+)\s+to\s+([A-Za-z0-9_$]+)/i
      );

    if (!rename) {
      return {
        plan: null,
        context: `
CURRENT FILE:

${liveBuffer}

USER REQUEST:

${userRequest}
`
      };
    }

    const oldName =
      rename[1];

    const newName =
      rename[2];

    const symbol =
      LiveBufferSymbolService.findSymbol(
        liveBuffer,
        oldName
      );

    if (!symbol) {
      return {
        plan: null,
        context: `
CURRENT FILE:

${liveBuffer}

USER REQUEST:

${userRequest}
`
      };
    }

    return {
      plan: {
        strategy:
          "rename_symbol",

        symbolType:
          symbol.type,

        oldName,

        newName,

        startLine:
          symbol.startLine,

        endLine:
          symbol.endLine
      },

      context: `
TARGET ${symbol.type.toUpperCase()}

NAME:
${symbol.name}

LINES:
${symbol.startLine}-${symbol.endLine}

CODE:

${symbol.content}

USER REQUEST:

${userRequest}
`
    };
  }

  static prepareFocusedEdit(
    plan,
    userRequest,
    liveBuffer
  ) {
    const symbolName =
      this.extractSymbolName(
        userRequest
      );

    if (!symbolName) {
      return {
        plan,
        context: `
CURRENT FILE:

${liveBuffer}

USER REQUEST:

${userRequest}
`
      };
    }

    const symbol =
      LiveBufferSymbolService.findSymbol(
        liveBuffer,
        symbolName
      );

    if (!symbol) {
      return {
        plan,
        context: `
CURRENT FILE:

${liveBuffer}

USER REQUEST:

${userRequest}
`
      };
    }

    return {
      plan,

      context: `
TARGET ${symbol.type.toUpperCase()}

NAME:
${symbol.name}

LINES:
${symbol.startLine}-${symbol.endLine}

CODE:

${symbol.content}

USER REQUEST:

${userRequest}
`
    };
  }

  static extractSymbolName(
    request
  ) {
    const match =
      request.match(
        /\b([A-Za-z_$][A-Za-z0-9_$]*)\s*\(?\)?/
      );

    if (!match) {
      return null;
    }

    const keywords =
      new Set([
        "fix",
        "optimize",
        "refactor",
        "rewrite",
        "modify",
        "change",
        "update",
        "replace",
        "insert",
        "delete",
        "remove",
        "add",
        "document",
        "explain"
      ]);

    for (const token of request.match(
      /[A-Za-z_$][A-Za-z0-9_$]*/g
    ) || []) {
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
}