export default class WorkspaceFixupService {
  static createPlan(
    verification = {},
    changeAnalysis = null
  ) {
    const plan = {
      required: false,

      fixes: [],

      warnings: [],

      summary: null
    };

    if (!verification) {
      plan.summary =
        "No verification available.";

      return plan;
    }

    if (
      verification.errors
        ?.length
    ) {
      plan.required =
        true;

      for (const error of verification.errors) {
        plan.fixes.push(
          this.fixForError(
            error
          )
        );
      }
    }

    if (
      changeAnalysis
        ?.requiresImportUpdate
    ) {
      plan.required =
        true;

      plan.fixes.push({
        type:
          "update_imports",

        priority:
          "high"
      });
    }

    if (
      changeAnalysis
        ?.requiresReferenceUpdate
    ) {
      plan.required =
        true;

      plan.fixes.push({
        type:
          "update_references",

        priority:
          "high"
      });
    }

    if (
      changeAnalysis
        ?.breakingChange
    ) {
      plan.warnings.push(
        "Breaking change detected."
      );
    }

    plan.summary =
      this.buildSummary(
        plan
      );

    return plan;
  }

  static fixForError(
    error
  ) {
    const text =
      String(
        error || ""
      ).toLowerCase();

    if (
      text.includes(
        "import"
      )
    ) {
      return {
        type:
          "update_imports",

        priority:
          "high"
      };
    }

    if (
      text.includes(
        "reference"
      )
    ) {
      return {
        type:
          "update_references",

        priority:
          "high"
      };
    }

    if (
      text.includes(
        "symbol"
      )
    ) {
      return {
        type:
          "repair_symbol",

        priority:
          "high"
      };
    }

    if (
      text.includes(
        "patch"
      )
    ) {
      return {
        type:
          "retry_patch",

        priority:
          "medium"
      };
    }

    return {
      type:
        "manual_review",

      priority:
        "low",

      reason:
        error
    };
  }

  static buildSummary(
    plan
  ) {
    return `
Fix-up Required:
${plan.required}

Fix Count:
${plan.fixes.length}

Warnings:
${plan.warnings.length}
`.trim();
  }

  static shouldRun(
    verification
  ) {
    return Boolean(
      verification &&
      (!verification.success ||
        verification.recommendations
          ?.length)
    );
  }
}