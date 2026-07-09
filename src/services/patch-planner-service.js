export default class PatchPlannerService {
  static createPlan(
    userPrompt
  ) {
    const text =
      String(
        userPrompt || ""
      ).trim();

    const prompt =
      text.toLowerCase();

    const plan =
      this.createDefaultPlan();

    plan.operation =
      this.detectOperation(
        prompt
      );

    plan.targetType =
      this.detectTargetType(
        prompt
      );

    plan.scope =
      this.detectScope(
        prompt
      );

    plan.risk =
      this.detectRisk(
        prompt
      );

    plan.confidence =
      this.detectConfidence(
        prompt
      );

    const rename =
      this.detectRename(
        text
      );

    if (rename) {
      plan.strategy =
        "rename_symbol";

      plan.intent =
        "rename_symbol";

      plan.operation =
        "rename";

      plan.scope =
        "workspace";

      plan.target =
        rename.oldName;

      plan.targetType =
        "symbol";

      plan.newName =
        rename.newName;

      plan.requiresReferenceUpdate =
        true;

      plan.risk =
        "high";

      plan.reason =
        "Explicit rename request.";

      return plan;
    }

    switch (
      plan.operation
    ) {
      case "edit_function":
        plan.strategy =
          "patch_function";

        plan.intent =
          "edit_function";

        break;

      case "edit_class":
        plan.strategy =
          "patch_class";

        plan.intent =
          "edit_class";

        break;

      case "imports":
        plan.strategy =
          "imports";

        plan.intent =
          "edit_imports";

        plan.requiresImportUpdate =
          true;

        break;

      case "create_file":
        plan.strategy =
          "create_file";

        plan.intent =
          "create_file";

        break;

      case "delete_file":
        plan.strategy =
          "delete_file";

        plan.intent =
          "delete_file";

        break;

      case "insert":
        plan.strategy =
          "insert";

        plan.intent =
          "insert_code";

        break;

      case "delete":
        plan.strategy =
          "delete";

        plan.intent =
          "delete_code";

        break;

      case "refactor":
        plan.strategy =
          "refactor";

        plan.intent =
          "refactor";

        plan.requiresReferenceUpdate =
          true;

        break;

      case "optimize":
        plan.strategy =
          "optimize";

        plan.intent =
          "optimize";

        break;

      case "fix":
        plan.strategy =
          "fix";

        plan.intent =
          "bug_fix";

        break;

      default:
        plan.strategy =
          "replace_file";

        plan.intent =
          "generic_edit";
    }

    return plan;
  }

  static createDefaultPlan() {
    return {
      strategy:
        "replace_file",

      intent:
        "generic_edit",

      operation:
        "edit",

      scope:
        "file",

      target:
        null,

      targetType:
        "unknown",

      newName:
        null,

      confidence:
        0.5,

      reason:
        null,

      requiresReferenceUpdate:
        false,

      requiresImportUpdate:
        false,

      risk:
        "low"
    };
  }

  static detectRename(
    text
  ) {
    const match =
      text.match(
        /rename\s+([A-Za-z_$][A-Za-z0-9_$]*)\s+to\s+([A-Za-z_$][A-Za-z0-9_$]*)/i
      );

    if (!match) {
      return null;
    }

    return {
      oldName:
        match[1],

      newName:
        match[2]
    };
  }

  static detectOperation(
    prompt
  ) {
    if (
      /replace function|rewrite function|modify function|change function|update function|fix function/i.test(
        prompt
      )
    ) {
      return "edit_function";
    }

    if (
      /replace class|rewrite class|modify class|change class|update class|fix class/i.test(
        prompt
      )
    ) {
      return "edit_class";
    }

    if (
      /add import|remove import|update import|change import/i.test(
        prompt
      )
    ) {
      return "imports";
    }

    if (
      /create file|new file/i.test(
        prompt
      )
    ) {
      return "create_file";
    }

    if (
      /delete file|remove file/i.test(
        prompt
      )
    ) {
      return "delete_file";
    }

    if (
      /refactor/i.test(
        prompt
      )
    ) {
      return "refactor";
    }

    if (
      /optimi[sz]e|performance/i.test(
        prompt
      )
    ) {
      return "optimize";
    }

    if (
      /fix|bug|issue|error/i.test(
        prompt
      )
    ) {
      return "fix";
    }

    if (
      /\binsert\b|\badd\b/i.test(
        prompt
      )
    ) {
      return "insert";
    }

    if (
      /\bdelete\b|\bremove\b/i.test(
        prompt
      )
    ) {
      return "delete";
    }

    return "edit";
  }

  static detectTargetType(
    prompt
  ) {
    if (
      /\bfunction\b/.test(
        prompt
      )
    ) {
      return "function";
    }

    if (
      /\bclass\b/.test(
        prompt
      )
    ) {
      return "class";
    }

    if (
      /\bimport\b/.test(
        prompt
      )
    ) {
      return "import";
    }

    if (
      /\bvariable\b|\bconst\b|\blet\b|\bvar\b/.test(
        prompt
      )
    ) {
      return "variable";
    }

    if (
      /\bfile\b/.test(
        prompt
      )
    ) {
      return "file";
    }

    return "unknown";
  }

  static detectScope(
    prompt
  ) {
    if (
      /workspace|project|every file|all files|across/i.test(
        prompt
      )
    ) {
      return "workspace";
    }

    return "file";
  }

  static detectRisk(
    prompt
  ) {
    if (
      /rename|delete|remove file|workspace/i.test(
        prompt
      )
    ) {
      return "high";
    }

    if (
      /create|refactor/i.test(
        prompt
      )
    ) {
      return "medium";
    }

    return "low";
  }

  static detectConfidence(
    prompt
  ) {
    let score =
      0.5;

    const keywords = [
      "rename",
      "function",
      "class",
      "file",
      "import",
      "refactor",
      "fix",
      "optimize",
      "delete",
      "create"
    ];

    for (const keyword of keywords) {
      if (
        prompt.includes(
          keyword
        )
      ) {
        score +=
          0.05;
      }
    }

    return Math.min(
      1,
      Number(
        score.toFixed(2)
      )
    );
  }
}