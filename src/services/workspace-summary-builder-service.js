export default class WorkspaceSummaryBuilderService {
  static buildSummary(
    index
  ) {
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

    return summary;
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

        return (
          scoreB - scoreA
        );
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