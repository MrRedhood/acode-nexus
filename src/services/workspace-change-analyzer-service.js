import DependencyResolverService from "./dependency-resolver-service.js";
import ImpactAnalysisService from "./impact-analysis-service.js";

export default class WorkspaceChangeAnalyzerService {
  static analyze(
    editContext = {}
  ) {
    const target =
      editContext.target;

    if (!target) {
      return {
        success: false,
        error:
          "No edit target."
      };
    }

    const dependency =
      editContext.dependency ||
      DependencyResolverService.resolve(
        target.name
      );

    const impact =
      editContext.impact ||
      ImpactAnalysisService.analyze(
        editContext.plan,
        target
      );

    const affectedFiles =
      this.collectFiles(
        target,
        impact
      );

    const affectedSymbols =
      this.collectSymbols(
        target,
        dependency
      );

    const analysis = {
      success: true,

      target,

      dependency,

      impact,

      affectedFiles,

      affectedSymbols,

      requiresImportUpdate:
        this.requiresImportUpdate(
          editContext
        ),

      requiresReferenceUpdate:
        this.requiresReferenceUpdate(
          editContext
        ),

      breakingChange:
        this.isBreakingChange(
          editContext
        ),

      workspaceScope:
        affectedFiles.length >
        1,

      confidence:
        this.calculateConfidence(
          editContext
        )
    };

    analysis.summary =
      this.buildSummary(
        analysis
      );

    return analysis;
  }

  static collectFiles(
    target,
    impact
  ) {
    const files =
      new Set();

    if (
      target?.path
    ) {
      files.add(
        target.path
      );
    }

    for (const item of impact
      ?.affectedFiles ||
      []) {
      if (
        item.file
      ) {
        files.add(
          item.file
        );
      }
    }

    return [
      ...files
    ];
  }

  static collectSymbols(
    target,
    dependency
  ) {
    const symbols =
      new Set();

    if (
      target?.name
    ) {
      symbols.add(
        target.name
      );
    }

    const add =
      list => {
        for (const item of list ||
          []) {
          if (
            typeof item ===
            "string"
          ) {
            symbols.add(
              item
            );
          } else if (
            item?.name
          ) {
            symbols.add(
              item.name
            );
          }
        }
      };

    add(
      dependency?.imports
    );

    add(
      dependency?.exports
    );

    add(
      dependency?.references
    );

    return [
      ...symbols
    ];
  }

  static requiresImportUpdate(
    context
  ) {
    return Boolean(
      context.plan
        ?.requiresImportUpdate
    );
  }

  static requiresReferenceUpdate(
    context
  ) {
    return Boolean(
      context.plan
        ?.requiresReferenceUpdate
    );
  }

  static isBreakingChange(
    context
  ) {
    return (
      context.plan
        ?.risk ===
      "high"
    );
  }

  static calculateConfidence(
    context
  ) {
    let score = 0.5;

    if (
      context.target
    ) {
      score += 0.2;
    }

    if (
      context.definition
    ) {
      score += 0.1;
    }

    if (
      context.references
        ?.length
    ) {
      score += 0.1;
    }

    if (
      context.dependency
    ) {
      score += 0.05;
    }

    if (
      context.impact
    ) {
      score += 0.05;
    }

    return Math.min(
      1,
      score
    );
  }

  static buildSummary(
    analysis
  ) {
    return `
Target:
${analysis.target.name}

Affected Files:
${analysis.affectedFiles.length}

Affected Symbols:
${analysis.affectedSymbols.length}

Workspace Scope:
${analysis.workspaceScope}

Reference Update:
${analysis.requiresReferenceUpdate}

Import Update:
${analysis.requiresImportUpdate}

Breaking Change:
${analysis.breakingChange}

Confidence:
${Math.round(
  analysis.confidence *
    100
)}%
`.trim();
  }
}