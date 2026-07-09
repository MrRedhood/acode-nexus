import SearchService from "./search-service.js";
import WorkspaceScopeService from "./workspace-scope-service.js";
import WorkspaceSymbolIndexService from "./workspace-symbol-index-service.js";

export default class WorkspaceQueryService {
  static async findDefinition(
    symbolName
  ) {
    if (!symbolName) {
      return null;
    }

    const indexed =
      WorkspaceSymbolIndexService.findExact(
        symbolName
      );

    if (indexed) {
      return {
        file:
          indexed.file,
        path:
          indexed.path,
        line:
          indexed.line,
        text:
          indexed.text,
        type:
          "definition"
      };
    }

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

    const scopedFiles =
      WorkspaceScopeService.getScopedFiles();

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

  static findSymbol(
    symbolName
  ) {
    return WorkspaceSymbolIndexService.findExact(
      symbolName
    );
  }

  static findSymbols(
    query
  ) {
    return WorkspaceSymbolIndexService.findSimilar(
      query
    );
  }

  static hasSymbol(
    symbolName
  ) {
    return WorkspaceSymbolIndexService.hasSymbol(
      symbolName
    );
  }

  static getFileSymbols(
    path
  ) {
    return WorkspaceSymbolIndexService.getFileSymbols(
      path
    );
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