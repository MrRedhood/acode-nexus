export default class WorkspaceVerificationService {
  static verify(
    execution = {},
    changeAnalysis = null
  ) {
    const report = {
      success: true,

      verified: false,

      errors: [],

      warnings: [],

      recommendations: [],

      summary: null
    };

    if (!execution) {
      report.success = false;

      report.errors.push(
        "Missing execution report."
      );

      report.summary =
        this.buildSummary(
          report
        );

      return report;
    }

    if (
      execution.rollback
    ) {
      report.success = false;

      report.errors.push(
        "Workspace transaction rolled back."
      );
    }

    if (
      execution.errors?.length
    ) {
      report.success = false;

      report.errors.push(
        ...execution.errors.map(
          error =>
            error.error ||
            JSON.stringify(
              error
            )
        )
      );
    }

    for (const file of execution.files ||
      []) {
      if (
        !file.success
      ) {
        report.success = false;

        report.errors.push(
          `Failed editing ${file.file}`
        );
      }

      const duplicates =
        this.findDuplicateActions(
          file.actions
        );

      if (
        duplicates.length
      ) {
        report.warnings.push(
          `Duplicate actions detected in ${file.file}`
        );
      }

      const conflicts =
        this.findConflicts(
          file.actions
        );

      if (
        conflicts.length
      ) {
        report.warnings.push(
          `Conflicting actions detected in ${file.file}`
        );
      }
    }

    if (
      changeAnalysis
    ) {
      if (
        changeAnalysis.breakingChange
      ) {
        report.recommendations.push(
          "Run workspace fix-up."
        );
      }

      if (
        changeAnalysis.requiresReferenceUpdate
      ) {
        report.recommendations.push(
          "Verify symbol references."
        );
      }

      if (
        changeAnalysis.requiresImportUpdate
      ) {
        report.recommendations.push(
          "Verify imports."
        );
      }

      if (
        changeAnalysis.workspaceScope
      ) {
        report.recommendations.push(
          "Run full workspace verification."
        );
      }
    }

    report.verified =
      report.success;

    report.summary =
      this.buildSummary(
        report
      );

    return report;
  }

  static findDuplicateActions(
    actions = []
  ) {
    const seen =
      new Set();

    const duplicates =
      [];

    for (const action of actions) {
      const key =
        JSON.stringify(
          action
        );

      if (
        seen.has(key)
      ) {
        duplicates.push(
          action
        );

        continue;
      }

      seen.add(
        key
      );
    }

    return duplicates;
  }

  static findConflicts(
    actions = []
  ) {
    const conflicts =
      [];

    let replace = false;

    let undo = false;

    for (const action of actions) {
      if (
        action.type ===
        "replace_file"
      ) {
        replace = true;
      }

      if (
        action.type ===
        "undo_file"
      ) {
        undo = true;
      }
    }

    if (
      replace &&
      undo
    ) {
      conflicts.push(
        "replace_file + undo_file"
      );
    }

    return conflicts;
  }

  static buildSummary(
    report
  ) {
    return `
Verified:
${report.verified}

Success:
${report.success}

Errors:
${report.errors.length}

Warnings:
${report.warnings.length}

Recommendations:
${report.recommendations.length}
`.trim();
  }
}