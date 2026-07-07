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
        return this.prepareFunction(
          request,
          liveBuffer
        );

      case "patch_class":
        return this.prepareClass(
          request,
          liveBuffer
        );

      case "insert":
        return this.prepareInsert(
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

  static prepareFunction(
    userRequest,
    liveBuffer
  ) {
    return {
      plan: {
        strategy:
          "patch_function"
      },

      context: `
CURRENT FILE:

${liveBuffer}

USER REQUEST:

${userRequest}
`
    };
  }

  static prepareClass(
    userRequest,
    liveBuffer
  ) {
    return {
      plan: {
        strategy:
          "patch_class"
      },

      context: `
CURRENT FILE:

${liveBuffer}

USER REQUEST:

${userRequest}
`
    };
  }

  static prepareInsert(
    userRequest,
    liveBuffer
  ) {
    return {
      plan: {
        strategy:
          "insert"
      },

      context: `
CURRENT FILE:

${liveBuffer}

USER REQUEST:

${userRequest}
`
    };
  }
}