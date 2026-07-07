import LiveBufferSymbolService from "./live-buffer-symbol-service.js";

export default class EditContextService {
  static async prepare(
    userRequest,
    liveBuffer
  ) {
    const request =
      String(
        userRequest || ""
      ).trim();

    const rename =
      request.match(
        /rename\s+([A-Za-z0-9_$]+)\s+to\s+([A-Za-z0-9_$]+)/i
      );

    if (rename) {
      return this.prepareRename(
        rename,
        request,
        liveBuffer
      );
    }

    return {
      plan: null,

      context: `
CURRENT FILE:

${liveBuffer}

USER REQUEST:

${request}
`
    };
  }

  static prepareRename(
    rename,
    userRequest,
    liveBuffer
  ) {
    const oldName =
      rename[1];

    const newName =
      rename[2];

    let symbol =
      LiveBufferSymbolService.findFunction(
        liveBuffer,
        oldName
      );

    let symbolType =
      "function";

    if (!symbol) {
      symbol =
        LiveBufferSymbolService.findClass(
          liveBuffer,
          oldName
        );

      symbolType =
        "class";
    }

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

        symbolType,

        oldName,

        newName,

        startLine:
          symbol.startLine,

        endLine:
          symbol.endLine
      },

      context: `
TARGET ${symbolType.toUpperCase()}

LINES:
${symbol.startLine}-${symbol.endLine}

CODE:

${symbol.content}

USER REQUEST:

${userRequest}
`
    };
  }
  }