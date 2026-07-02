import IndexingService from "./indexing-service.js";

export default class WorkspaceSummaryService {
  static currentSummary = null;

  static buildSummary() {
    const index =
      IndexingService.getIndex();

    if (!index) {
      return null;
    }

    const files =
      index.files || [];

    const summary = {
      workspace:
        index.workspace,

      totalFiles:
        files.length,

      directories:
        this.extractDirectories(
          files
        ),

      fileTypes:
        this.countFileTypes(
          files
        ),

      architecture:
        this.detectArchitecture(
          files
        ),

      keyModules:
        this.extractKeyModules(
          files
        ),

      totals: {
        functions: 0,
        classes: 0,
        imports: 0
      }
    };

    for (const file of files) {
      summary.totals.functions +=
        (
          file.functions ||
          []
        ).length;

      summary.totals.classes +=
        (
          file.classes ||
          []
        ).length;

      summary.totals.imports +=
        (
          file.imports ||
          []
        ).length;
    }

    this.currentSummary =
      summary;

    console.log(
      "[WORKSPACE SUMMARY]",
      summary
    );

    return summary;
  }

  static getSummary() {
    return this.currentSummary;
  }

  static buildPromptSummary() {
    const summary =
      this.getSummary() ||
      this.buildSummary();

    if (!summary) {
      return "";
    }

    const keyModules =
      summary.keyModules
        .slice(0, 8)
        .map(
          file =>
            `- ${file.name} (${file.path})`
        )
        .join("\n");

    const directories =
      summary.directories
        .slice(0, 12)
        .join(", ");

    const architecture =
      Object.entries(
        summary.architecture
      )
        .filter(
          ([, value]) => value
        )
        .map(([key]) => key)
        .join(", ");

    return `
ACTIVE WORKSPACE:
${summary.workspace}

WORKSPACE OVERVIEW:
- Total files: ${summary.totalFiles}
- Total functions: ${summary.totals.functions}
- Total classes: ${summary.totals.classes}
- Total imports: ${summary.totals.imports}

ARCHITECTURE:
${architecture || "Unknown"}

DIRECTORIES:
${directories || "None"}

KEY MODULES:
${keyModules || "None"}

Important:
You are inside this workspace.
Use workspace knowledge when answering coding questions.
Do not hallucinate files that do not exist.
`;
  }

  static extractDirectories(
    files
  ) {
    return [
      ...new Set(
        files
          .map(file => {
            const parts =
              (
                file.path || ""
              ).split("/");

            if (
              parts.length <= 1
            ) {
              return null;
            }

            return parts
              .slice(
                0,
                parts.length - 1
              )
              .join("/");
          })
          .filter(Boolean)
      )
    ];
  }

  static countFileTypes(
    files
  ) {
    const map = {};

    for (const file of files) {
      const ext =
        file.extension ||
        "unknown";

      map[ext] =
        (map[ext] || 0) + 1;
    }

    return map;
  }

  static detectArchitecture(
    files
  ) {
    const paths =
      files.map(
        file =>
          file.path || ""
      );

    return {
      hasCore:
        paths.some(path =>
          path.includes(
            "/core/"
          )
        ),

      hasServices:
        paths.some(path =>
          path.includes(
            "/services/"
          )
        ),

      hasUI:
        paths.some(path =>
          path.includes(
            "/ui/"
          )
        ),

      hasAgents:
        paths.some(path =>
          path.includes(
            "/agents/"
          )
        )
    };
  }

  static extractKeyModules(
    files
  ) {
    return files
      .filter(file => {
        const score =
          (
            file.functions
              ?.length || 0
          ) +
          (
            file.classes
              ?.length || 0
          ) +
          (
            file.exports
              ?.length || 0
          );

        return score > 0;
      })
      .sort((a, b) => {
        const scoreA =
          (
            a.functions
              ?.length || 0
          ) +
          (
            a.classes
              ?.length || 0
          );

        const scoreB =
          (
            b.functions
              ?.length || 0
          ) +
          (
            b.classes
              ?.length || 0
          );

        return scoreB - scoreA;
      })
      .slice(0, 10)
      .map(file => ({
        name:
          file.name,
        path:
          file.path
      }));
  }
}