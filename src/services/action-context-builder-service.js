export default class ActionContextBuilderService {
  static build(context = {}) {
    const sections = [];

    const push = (title, value) => {
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

    push(
      "PRIMARY TARGET",
      this.buildTarget(
        context.target
      )
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
      "TASK PLAN",
      this.buildTaskPlan(
        context.taskPlan
      )
    );

    push(
      "TARGET CODE",
      context.target
        ?.content
    );

    push(
      "USER REQUEST",
      context.request
    );

    push(
      "INSTRUCTIONS",
      `
Modify only what is necessary.

Preserve formatting.

Preserve coding style.

Do not rewrite unrelated code.

Return Nexus actions only.
`
    );

    return sections.join(
      "\n\n"
    );
  }

  static buildTarget(
    target
  ) {
    if (!target) {
      return "[Unknown]";
    }

    return `
FILE:
${target.file || "[Current File]"}

PATH:
${target.path || "[Current File]"}

TYPE:
${target.symbolType}

NAME:
${target.name}

LINES:
${target.startLine}-${target.endLine}

SOURCE:
${target.source}
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
                  candidate.result
                    .path ||
                  candidate.result
                    .file ||
                  candidate.result
                    .name
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

    return JSON.stringify(
      impact,
      null,
      2
    );
  }

  static buildTaskPlan(
    taskPlan
  ) {
    if (!taskPlan) {
      return "[None]";
    }

    return taskPlan.tasks
      .map(
        task =>
          `• ${task.title} (${task.status})`
      )
      .join("\n");
  }
}