import SearchService from "./search-service.js";

export default class SymbolService {
  static async findClass(
    className
  ) {
    return await this.findPattern(
      new RegExp(
        `export\\s+default\\s+class\\s+${className}\\b|class\\s+${className}\\b`
      )
    );
  }

  static async findFunction(
    functionName
  ) {
    return await this.findPattern(
      new RegExp(
        `static\\s+${functionName}\\s*\\(|${functionName}\\s*\\(`
      )
    );
  }

  static async findPattern(
    pattern
  ) {
    const files =
      SearchService.getWorkspaceFiles
        ? SearchService.getWorkspaceFiles()
        : [];

    for (const file of files) {
      try {
        const content =
          await SearchService.readFullFile(
            file.path ||
              file.name
          );

        if (!content) {
          continue;
        }

        const result =
          this.findInText(
            content,
            pattern
          );

        if (result) {
          return {
            file:
              file.path ||
              file.name,
            ...result
          };
        }
      } catch (error) {
        console.error(
          error
        );
      }
    }

    return null;
  }

  static findInText(
    content,
    pattern
  ) {
    const lines =
      content.split("\n");

    for (
      let i = 0;
      i < lines.length;
      i++
    ) {
      if (
        !pattern.test(
          lines[i]
        )
      ) {
        continue;
      }

      return this.extractBlock(
        lines,
        i
      );
    }

    return null;
  }

  static extractBlock(
    lines,
    startIndex
  ) {
    let braceDepth = 0;
    let started = false;
    let endIndex =
      startIndex;

    for (
      let i = startIndex;
      i < lines.length;
      i++
    ) {
      const line =
        lines[i];

      for (const ch of line) {
        if (ch === "{") {
          braceDepth++;
          started = true;
        }

        if (ch === "}") {
          braceDepth--;
        }
      }

      endIndex = i;

      if (
        started &&
        braceDepth === 0
      ) {
        break;
      }
    }

    return {
      startLine:
        startIndex + 1,

      endLine:
        endIndex + 1,

      content:
        lines
          .slice(
            startIndex,
            endIndex + 1
          )
          .join("\n")
    };
  }
}