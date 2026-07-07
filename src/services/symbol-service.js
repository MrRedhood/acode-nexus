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
        pattern.test(
          lines[i]
        )
      ) {
        return {
          line:
            i + 1,
          content:
            lines[i]
        };
      }
    }

    return null;
  }
}