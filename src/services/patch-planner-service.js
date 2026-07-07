import SymbolService from "./symbol-service.js";

export default class PatchPlannerService {
  static async createPlan(
    userPrompt
  ) {
    if (!userPrompt) {
      return null;
    }

    const prompt =
      userPrompt.toLowerCase();

    if (
      prompt.includes("rename")
    ) {
      return await this.planRename(
        userPrompt
      );
    }

    if (
      prompt.includes("replace")
    ) {
      return await this.planReplace(
        userPrompt
      );
    }

    if (
      prompt.includes("add") ||
      prompt.includes("insert")
    ) {
      return await this.planInsert(
        userPrompt
      );
    }

    return {
      strategy:
        "replace_file"
    };
  }

  static async planRename(
    prompt
  ) {
    const match =
      prompt.match(
        /rename\s+([A-Za-z0-9_$]+)\s+to\s+([A-Za-z0-9_$]+)/i
      );

    if (!match) {
      return null;
    }

    const oldName =
      match[1];

    const newName =
      match[2];

    let symbol =
      await SymbolService.findFunction(
        oldName
      );

    let type =
      "function";

    if (!symbol) {
      symbol =
        await SymbolService.findClass(
          oldName
        );

      type = "class";
    }

    if (!symbol) {
      return null;
    }

    return {
      strategy:
        "rename_symbol",

      symbolType:
        type,

      oldName,

      newName,

      ...symbol
    };
  }

  static async planReplace(
    prompt
  ) {
    return {
      strategy:
        "patch_function",

      prompt
    };
  }

  static async planInsert(
    prompt
  ) {
    return {
      strategy:
        "insert",

      prompt
    };
  }
}