import PatchSetService from "./patch-set-service.js";
import WorkspaceRefactorSummaryService from "./workspace-refactor-summary-service.js";

export default class WorkspaceRefactorService {
  static build(
    actions,
    impact
  ) {
    const result = {
      success: true,
      patchSet: null,
      warnings: [],
      errors: []
    };

    if (
      !Array.isArray(actions) ||
      actions.length === 0
    ) {
      result.success = false;

      result.errors.push(
        "No actions returned by AI."
      );

      return result;
    }

    const patchSet =
      PatchSetService.build(
        actions
      );

    if (
      !PatchSetService.validate(
        patchSet
      )
    ) {
      result.success = false;

      result.errors.push(
        "Invalid patch set."
      );

      return result;
    }

    if (
      impact &&
      impact.scope ===
        "workspace"
    ) {
      this.validateWorkspaceCoverage(
        patchSet,
        impact,
        result
      );
    }

    result.patchSet =
      patchSet;

    return result;
  }

  static validateWorkspaceCoverage(
    patchSet,
    impact,
    result
  ) {
    const expected =
      new Set();

    const actual =
      new Set();

    for (const file of
      impact.affectedFiles ||
      []) {
      expected.add(
        file.file
      );
    }

    for (const group of
      patchSet.groups ||
      []) {
      actual.add(
        group.file
      );
    }

    for (const file of expected) {
      if (
        !actual.has(file)
      ) {
        result.warnings.push(
          `Missing modification for ${file}`
        );
      }
    }

    if (
      result.warnings.length
    ) {
      result.success = false;

      result.errors.push(
        "Workspace refactor is incomplete."
      );
    }
  }

  static summarize(
    result
  ) {
    return WorkspaceRefactorSummaryService.summarize(
      result
    );
  }
}