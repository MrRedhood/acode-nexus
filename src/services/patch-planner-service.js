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

    const plan = {
      strategy:
        "replace_file",

      intent:
        "generic_edit",

      scope:
        "file",

      target: null,

      reason: null,

      requiresReferenceUpdate:
        false,

      requiresImportUpdate:
        false,

      risk:
        "low"
    };

    const rename =
      prompt.match(
        /rename\s+([A-Za-z_$][A-Za-z0-9_$]*)\s+to\s+([A-Za-z_$][A-Za-z0-9_$]*)/i
      );

    if (rename) {
      plan.strategy =
        "rename_symbol";

      plan.intent =
        "rename_symbol";

      plan.scope =
        "workspace";

      plan.target =
        rename[1];

      plan.newName =
        rename[2];

      plan.requiresReferenceUpdate =
        true;

      plan.risk =
        "high";

      return plan;
    }

    if (
      /replace function|rewrite function|modify function|change function|update function|fix function/i.test(
        prompt
      )
    ) {
      plan.strategy =
        "patch_function";

      plan.intent =
        "edit_function";

      plan.scope =
        "file";

      return plan;
    }

    if (
      /replace class|rewrite class|modify class|change class|update class|fix class/i.test(
        prompt
      )
    ) {
      plan.strategy =
        "patch_class";

      plan.intent =
        "edit_class";

      plan.scope =
        "file";

      return plan;
    }

    if (
      /add import|remove import|change import|update import/i.test(
        prompt
      )
    ) {
      plan.strategy =
        "imports";

      plan.intent =
        "edit_imports";

      plan.scope =
        "file";

      plan.requiresImportUpdate =
        true;

      return plan;
    }

    if (
      /create file|new file/i.test(
        prompt
      )
    ) {
      plan.strategy =
        "create_file";

      plan.intent =
        "create_file";

      plan.scope =
        "workspace";

      plan.risk =
        "medium";

      return plan;
    }

    if (
      /delete file|remove file/i.test(
        prompt
      )
    ) {
      plan.strategy =
        "delete_file";

      plan.intent =
        "delete_file";

      plan.scope =
        "workspace";

      plan.risk =
        "high";

      return plan;
    }

    if (
      /insert|add/i.test(
        prompt
      )
    ) {
      plan.strategy =
        "insert";

      plan.intent =
        "insert_code";

      return plan;
    }

    if (
      /delete|remove/i.test(
        prompt
      )
    ) {
      plan.strategy =
        "delete";

      plan.intent =
        "delete_code";

      return plan;
    }

    if (
      /refactor/i.test(
        prompt
      )
    ) {
      plan.strategy =
        "refactor";

      plan.intent =
        "refactor";

      plan.scope =
        "workspace";

      plan.requiresReferenceUpdate =
        true;

      plan.risk =
        "medium";

      return plan;
    }

    if (
      /optimi[sz]e|performance/i.test(
        prompt
      )
    ) {
      plan.strategy =
        "optimize";

      plan.intent =
        "optimize";

      plan.scope =
        "file";

      return plan;
    }

    if (
      /fix|bug|issue|error/i.test(
        prompt
      )
    ) {
      plan.strategy =
        "fix";

      plan.intent =
        "bug_fix";

      plan.scope =
        "file";

      return plan;
    }

    return plan;
  }
}