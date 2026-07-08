import DependencyResolverService from "./dependency-resolver-service.js";

export default class ImpactAnalysisService {
  static analyze(
    plan,
    target
  ) {
    if (
      !plan ||
      !target
    ) {
      return {
        scope: "file",
        impact: "low",
        affectedFiles: [],
        reason:
          "No target resolved"
      };
    }

    const dependency =
      DependencyResolverService.resolve(
        target.name
      );

    const affected =
      new Map();

    const addFile = (
      file,
      reason
    ) => {
      if (!file) {
        return;
      }

      if (
        !affected.has(file)
      ) {
        affected.set(file, {
          file,
          reasons: []
        });
      }

      affected
        .get(file)
        .reasons.push(
          reason
        );
    };

    addFile(
      target.file ||
        "[Current File]",
      "Primary target"
    );

    if (dependency) {
      for (const importer of dependency.importers) {
        addFile(
          importer.file,
          "Imports target module"
        );
      }
    }

    const affectedFiles =
      Array.from(
        affected.values()
      );

    let scope = "file";
    let impact = "low";

    switch (
      plan.strategy
    ) {
      case "rename_symbol":
        scope =
          affectedFiles.length >
          1
            ? "workspace"
            : "file";

        impact =
          affectedFiles.length >
          3
            ? "high"
            : affectedFiles.length >
              1
            ? "medium"
            : "low";

        break;

      case "patch_function":
      case "patch_class":
        scope = "file";

        impact =
          affectedFiles.length >
          2
            ? "medium"
            : "low";

        break;

      case "replace_file":
        scope = "file";
        impact = "high";
        break;

      default:
        break;
    }

    return {
      scope,
      impact,
      affectedFiles,
      dependency,

      summary:
        this.buildSummary(
          scope,
          impact,
          affectedFiles
        )
    };
  }

  static buildSummary(
    scope,
    impact,
    affectedFiles
  ) {
    const lines = [];

    lines.push(
      `SCOPE: ${scope}`
    );

    lines.push(
      `IMPACT: ${impact}`
    );

    lines.push("");

    lines.push(
      `AFFECTED FILES (${affectedFiles.length})`
    );

    if (
      !affectedFiles.length
    ) {
      lines.push(
        "- None"
      );
    }

    for (const file of affectedFiles) {
      lines.push(
        `- ${file.file}`
      );

      for (const reason of file.reasons) {
        lines.push(
          `    • ${reason}`
        );
      }
    }

    return lines.join(
      "\n"
    );
  }
}