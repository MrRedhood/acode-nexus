export default class WorkspaceFixupService {
  static createPlan(
    verification = {},
    changeAnalysis = null
  ) {
    const plan = {
      required: false,

      fixes: [],

      warnings: [],

      difficulty:
        "low",

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

    return this.optimizePlan(
      plan
    );
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

  static optimizePlan(
    plan
  ) {
    const unique =
      new Map();

    for (const fix of plan.fixes) {
      if (
        !unique.has(
          fix.type
        )
      ) {
        unique.set(
          fix.type,
          fix
        );
      }
    }

    plan.fixes = [
      ...unique.values()
    ];

    const hasSpecific =
      plan.fixes.some(
        fix =>
          fix.type !==
          "manual_review"
      );

    if (
      hasSpecific
    ) {
      plan.fixes =
        plan.fixes.filter(
          fix =>
            fix.type !==
            "manual_review"
        );
    }

    const priority = {
      high: 1,
      medium: 2,
      low: 3
    };

    plan.fixes.sort(
      (a, b) =>
        (priority[
          a.priority
        ] || 99) -
        (priority[
          b.priority
        ] || 99)
    );

    const hasHigh =
      plan.fixes.some(
        fix =>
          fix.priority ===
          "high"
      );

    const hasMedium =
      plan.fixes.some(
        fix =>
          fix.priority ===
          "medium"
      );

    if (
      hasHigh
    ) {
      plan.difficulty =
        "high";
    } else if (
      hasMedium
    ) {
      plan.difficulty =
        "medium";
    } else {
      plan.difficulty =
        "low";
    }

    plan.summary =
      this.buildSummary(
        plan
      );

    return plan;
  }

  static buildSummary(
    plan
  ) {
    const fixList =
      plan.fixes.length
        ? plan.fixes
            .map(
              fix =>
                `- ${fix.type} (${fix.priority})`
            )
            .join("\n")
        : "[None]";

    return `
Fix-up Required:
${plan.required}

Repair Difficulty:
${plan.difficulty}

Fix Count:
${plan.fixes.length}

Warnings:
${plan.warnings.length}

Fixes

${fixList}
`.trim();
  }

  static shouldRun(
    verification
  ) {
    return Boolean(
      verification &&
      (
        !verification.success ||
        verification.recommendations
          ?.length
      )
    );
  }
}