import WorkspaceScopeService from "./workspace-scope-service.js";
import SearchService from "./search-service.js";

export default class IndexingService {
  static currentIndex = null;

  static buildVersion = 0;

  static async buildIndex() {
    const version =
      ++this.buildVersion;

    try {
      const files =
        WorkspaceScopeService.getScopedFiles() ||
        [];

      const workspace =
        WorkspaceScopeService.getSelectedRoot();

      const indexedFiles =
        [];

      for (const file of files) {
        if (!file) {
          continue;
        }

        const fileData = {
          name:
            file.name ||
            "unknown",

          path:
            file.path || "",

          extension:
            this.getExtension(
              file.name
            ),

          size:
            file.size || 0,

          imports: [],
          exports: [],
          classes: [],
          functions: []
        };

        const ext =
          fileData.extension;

        const shouldAnalyze =
          [
            "js",
            "ts",
            "json",
            "css",
            "md"
          ].includes(ext);

        if (shouldAnalyze) {
          try {
            const content =
              await this.readFileContent(
                file
              );

            if (
              content
            ) {
              fileData.imports =
                this.extractImports(
                  content
                );

              fileData.exports =
                this.extractExports(
                  content
                );

              fileData.classes =
                this.extractClasses(
                  content
                );

              fileData.functions =
                this.extractFunctions(
                  content
                );
            }
          } catch (err) {
            console.error(
              "[INDEX FILE ERROR]",
              file.path,
              err
            );
          }
        }

        indexedFiles.push(
          fileData
        );
      }

      if (
        version !==
        this.buildVersion
      ) {
        console.log(
          "[INDEX CANCELLED]"
        );
        return null;
      }

      const index = {
        workspace,
        totalFiles:
          indexedFiles.length,
        generatedAt:
          Date.now(),
        files:
          indexedFiles
      };

      this.currentIndex =
        index;

      console.log(
        "[INDEX BUILT]",
        index
      );

      return index;
    } catch (error) {
      console.error(
        "[INDEX BUILD FAILED]",
        error
      );

      return null;
    }
  }

  static getIndex() {
    return (
      this.currentIndex
    );
  }

  static async readFileContent(
    file
  ) {
    try {
      const result =
        await SearchService.readFile(
          file.path
        );

      if (
        !result
      ) {
        return null;
      }

      return (
        result.content ||
        null
      );
    } catch (error) {
      console.error(
        "[READ FILE FAILED]",
        file.path,
        error
      );

      return null;
    }
  }

  static extractImports(
    content
  ) {
    const matches =
      content.matchAll(
        /import\s+.*?from\s+["'](.+?)["']/g
      );

    return [
      ...new Set(
        [...matches].map(
          match =>
            match[1]
        )
      )
    ];
  }

  static extractExports(
    content
  ) {
    const matches =
      content.matchAll(
        /export\s+(?:default\s+)?(?:class|function|const|let|var)?\s*([A-Za-z0-9_$]*)/g
      );

    return [
      ...new Set(
        [...matches]
          .map(
            match =>
              match[1]
          )
          .filter(Boolean)
      )
    ];
  }

  static extractClasses(
    content
  ) {
    const matches =
      content.matchAll(
        /class\s+([A-Za-z0-9_$]+)/g
      );

    return [
      ...new Set(
        [...matches].map(
          match =>
            match[1]
        )
      )
    ];
  }

  static extractFunctions(
    content
  ) {
    const matches =
      content.matchAll(
        /(?:async\s+)?([A-Za-z0-9_$]+)\s*\([^)]*\)\s*\{/g
      );

    return [
      ...new Set(
        [...matches]
          .map(
            match =>
              match[1]
          )
          .filter(
            name =>
              ![
                "if",
                "for",
                "while",
                "switch",
                "catch"
              ].includes(
                name
              )
          )
      )
    ];
  }

  static getExtension(
    name
  ) {
    if (!name) {
      return "";
    }

    const parts =
      name.split(".");

    if (
      parts.length < 2
    ) {
      return "";
    }

    return parts.pop();
  }
}