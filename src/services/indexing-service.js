import WorkspaceScopeService from "./workspace-scope-service.js";
import SearchService from "./search-service.js";
import SourceAnalyzerService from "./source-analyzer-service.js";

export default class IndexingService {
  static currentIndex =
    null;

  static buildVersion =
    0;

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
            SourceAnalyzerService.getExtension(
              file.name
            ),

          size:
            file.size || 0,

          imports: [],
          exports: [],
          classes: [],
          functions: []
        };

        const shouldAnalyze =
          [
            "js",
            "ts",
            "json",
            "css",
            "md"
          ].includes(
            fileData.extension
          );

        if (
          shouldAnalyze
        ) {
          try {
            const content =
              await this.readFileContent(
                file
              );

            if (
              content
            ) {
              Object.assign(
                fileData,
                SourceAnalyzerService.analyze(
                  content
                )
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
    return this.currentIndex;
  }

  static async readFileContent(
    file
  ) {
    try {
      const content =
        await SearchService.readFullFile(
          file.path
        );

      return (
        content ||
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
}