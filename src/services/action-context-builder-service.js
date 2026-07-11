import ActionPlannerService from "./action-planner-service.js";

export default class ActionContextBuilderService {
  static build(context = {}) {
    const sections = [];

    const push = (
      title,
      value
    ) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return;
      }

      sections.push(`
${title}

${value}
`.trim());
    };

    const planner =
      ActionPlannerService.build(
        context.taskPlan,
        context
      );

    push(
      "USER REQUEST",
      context.request
    );

    push(
      "ACTION PLAN",
      this.buildPlanner(
        planner
      )
    );

    push(
      "PRIMARY TARGET",
      this.buildTarget(
        context.target
      )
    );

    push(
      "TARGET CODE",
      context.target
        ?.content ||
        context.liveBuffer
    );

    push(
      "DEFINITION",
      this.buildDefinition(
        context.definition
      )
    );

    push(
      "REFERENCES",
      this.buildReferences(
        context.references
      )
    );

    push(
      "INTENT ANALYSIS",
      this.buildIntent(
        context.intent
      )
    );

    push(
      "DEPENDENCY GRAPH",
      this.buildDependency(
        context.dependency
      )
    );

    push(
      "IMPACT ANALYSIS",
      this.buildImpact(
        context.impact
      )
    );

    push(
      "WORKSPACE CHANGE ANALYSIS",
      this.buildChangeAnalysis(
        context.changeAnalysis
      )
    );

    push(
      "TASK PLAN",
      this.buildTaskPlan(
        context.taskPlan
      )
    );

    return sections.join(
      "\n\n"
    );
  }

  static buildPlanner(
    planner
  ) {
    if (!planner) {
      return "[None]";
    }

    return `
OUTPUT:
${planner.output}

ACTION TYPE:
${planner.actionType}

PATCH STYLE:
${planner.patchStyle}

TARGET TYPE:
${planner.targetType}

SCOPE:
${planner.scope}

RISK:
${planner.risk}

VERIFY IMPORTS:
${planner.verifyImports}

VERIFY REFERENCES:
${planner.verifyReferences}

VERIFY WORKSPACE:
${planner.verifyWorkspace}

PRESERVE FORMATTING:
${planner.preserveFormatting}

PRESERVE COMMENTS:
${planner.preserveComments}

PRESERVE IMPORTS:
${planner.preserveImports}

MINIMAL CHANGES:
${planner.minimalChanges}

ALLOW CREATE FILES:
${planner.allowCreateFiles}

ALLOW DELETE FILES:
${planner.allowDeleteFiles}

ALLOW RENAME:
${planner.allowRename}

ALLOW WORKSPACE CHANGES:
${planner.allowWorkspaceChanges}
`.trim();
  }

  static buildTarget(
    target
  ) {
    if (!target) {
      return "[Current File]";
    }

    return `
FILE:
${target.file || "[Current File]"}

PATH:
${target.path || "[Current File]"}

TYPE:
${target.symbolType || "[Unknown]"}

NAME:
${target.name || "[Unknown]"}

LINES:
${target.startLine ?? "?"}-${target.endLine ?? "?"}

SOURCE:
${target.source || "[Unknown]"}
`.trim();
  }

  static buildDefinition(
    definition
  ) {
    if (!definition) {
      return "[Unknown]";
    }

    return `
FILE:
${definition.file}

LINE:
${definition.line}
`.trim();
  }

  static buildReferences(
    references = []
  ) {
    if (!references.length) {
      return "[None]";
    }

    return references
      .slice(0, 30)
      .map(
        ref =>
          `${ref.file}:${ref.line} (${ref.type})`
      )
      .join("\n");
  }

  static buildIntent(
    intent
  ) {
    if (!intent) {
      return "[None]";
    }

    const keywords =
      intent.keywords?.join(
        ", "
      ) || "[None]";

    const candidates =
      intent.candidates?.length
        ? intent.candidates
            .slice(0, 10)
            .map(
              candidate =>
                `${candidate.score} | ${candidate.type} | ${
                  candidate.result.path ||
                  candidate.result.file ||
                  candidate.result.name
                }`
            )
            .join("\n")
        : "[None]";

    return `
KEYWORDS

${keywords}

TOP CANDIDATES

${candidates}
`.trim();
  }

  static buildDependency(
    dependency
  ) {
    if (!dependency) {
      return "[None]";
    }

    return (
      dependency.summary ||
      JSON.stringify(
        dependency,
        null,
        2
      )
    );
  }

  static buildImpact(
    impact
  ) {
    if (!impact) {
      return "[None]";
    }

    return (
      impact.summary ||
      JSON.stringify(
        impact,
        null,
        2
      )
    );
  }

  static buildChangeAnalysis(
    analysis
  ) {
    if (!analysis) {
      return "[None]";
    }

    const files =
      analysis.affectedFiles
        ?.length
        ? analysis.affectedFiles.join(
            "\n"
          )
        : "[None]";

    const symbols =
      analysis.affectedSymbols
        ?.length
        ? analysis.affectedSymbols.join(
            "\n"
          )
        : "[None]";

    return `
WORKSPACE SCOPE:
${analysis.workspaceScope}

BREAKING CHANGE:
${analysis.breakingChange}

IMPORT UPDATE REQUIRED:
${analysis.requiresImportUpdate}

REFERENCE UPDATE REQUIRED:
${analysis.requiresReferenceUpdate}

CONFIDENCE:
${Math.round(
  (analysis.confidence ||
    0) * 100
)}%

AFFECTED FILES

${files}

AFFECTED SYMBOLS

${symbols}

SUMMARY

${analysis.summary || "[None]"}
`.trim();
  }

  static buildTaskPlan(
    taskPlan
  ) {
    if (!taskPlan) {
      return "[None]";
    }

    const strategy =
      taskPlan.strategy
        ? `Strategy: ${taskPlan.strategy}\n`
        : "";

    const risk =
      taskPlan.risk
        ? `Risk: ${taskPlan.risk}\n`
        : "";

    const scope =
      taskPlan.scope
        ? `Scope: ${taskPlan.scope}\n`
        : "";

    const tasks =
      taskPlan.tasks?.length
        ? taskPlan.tasks
            .map(
              (task, index) =>
                `${index + 1}. ${task.title} (${task.status})`
            )
            .join("\n")
        : "[None]";

    return `
${strategy}${risk}${scope}

TASKS

${tasks}
`.trim();
  }
}