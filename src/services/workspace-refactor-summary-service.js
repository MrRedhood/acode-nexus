export default class WorkspaceRefactorSummaryService {
  static summarize(
    result
  ) {
    if (!result) {
      return "";
    }

    const lines = [];

    lines.push(
      `SUCCESS: ${result.success}`
    );

    if (
      result.errors?.length
    ) {
      lines.push("");
      lines.push(
        "ERRORS:"
      );

      for (const error of result.errors) {
        lines.push(
          `- ${error}`
        );
      }
    }

    if (
      result.warnings?.length
    ) {
      lines.push("");
      lines.push(
        "WARNINGS:"
      );

      for (const warning of result.warnings) {
        lines.push(
          `- ${warning}`
        );
      }
    }

    if (
      result.patchSet
    ) {
      lines.push("");
      lines.push(
        `FILES: ${result.patchSet.getFiles().length}`
      );

      lines.push(
        `ACTIONS: ${result.patchSet.totalActions()}`
      );
    }

    return lines.join(
      "\n"
    );
  }
}