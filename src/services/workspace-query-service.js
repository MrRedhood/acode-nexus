import SearchService from "./search-service.js";

export default class WorkspaceQueryService {
  static async findDefinition(
    symbolName
  ) {
    const references =
      await this.findReferences(
        symbolName
      );

    return (
      references.find(
        ref =>
          ref.type ===
          "definition"
      ) || null
    );
  }

  static async findReferences(
    symbolName
  ) {
    if (!symbolName) {
      return [];
    }

    const files =
      SearchService.openFile
        ? null
        : null;

    const scopedFiles =
      (
        await import(
          "./workspace-scope-service.js"
        )
      ).default.getScopedFiles();

    const results = [];

    const escaped =
      symbolName.replace(
        /[-\/\\^$*+?.()|[\]{}]/g,
        "\\$&"
      );

    const symbolRegex =
      new RegExp(
        `\\b${escaped}\\b`
      );

    for (const file of scopedFiles) {
      try {
        const content =
          await SearchService.fetchFileContent(
            file
          );

        if (!content) {
          continue;
        }

        const lines =
          content.split("\n");

        for (
          let i = 0;
          i < lines.length;
          i++
        ) {
          const line =
            lines[i];

          if (
            !symbolRegex.test(
              line
            )
          ) {
            continue;
          }

          results.push({
            file:
              file.name,

            path:
              file.path,

            line:
              i + 1,

            text:
              line.trim(),

            type:
              this.classifyLine(
                line,
                symbolName
              )
          });
        }
      } catch (error) {
        console.error(
          error
        );
      }
    }

    return results;
  }

  static classifyLine(
    line,
    symbol
  ) {
    const escaped =
      symbol.replace(
        /[-\/\\^$*+?.()|[\]{}]/g,
        "\\$&"
      );

    if (
      new RegExp(
        `\\bclass\\s+${escaped}\\b`
      ).test(line)
    ) {
      return "definition";
    }

    if (
      new RegExp(
        `\\bfunction\\s+${escaped}\\b`
      ).test(line)
    ) {
      return "definition";
    }

    if (
      new RegExp(
        `\\basync\\s+${escaped}\\s*\\(`
      ).test(line)
    ) {
      return "definition";
    }

    if (
      new RegExp(
        `\\bstatic\\s+${escaped}\\s*\\(`
      ).test(line)
    ) {
      return "definition";
    }

    if (
      line.includes(
        "import"
      )
    ) {
      return "import";
    }

    if (
      line.includes(
        "export"
      )
    ) {
      return "export";
    }

    return "reference";
  }
}