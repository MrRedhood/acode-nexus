import WorkspaceScopeService from "./workspace-scope-service.js";
import WorkspaceManager from "./workspace-manager.js";
import FileContentService from "./file-content-service.js";
import SearchableFileService from "./searchable-file-service.js";

export default class SearchService {
  static async rebuildIndex() {
    try {
      console.log(
        "===== SEARCH REBUILD START ====="
      );

      FileContentService.clearCache();

      await WorkspaceManager.scanWorkspace();

      console.log(
        "File cache cleared"
      );

      console.log(
        "Workspace rescanned"
      );

      console.log(
        "Workspace files:",
        WorkspaceManager.getFiles()
          .length
      );

      console.log(
        "===== SEARCH REBUILD DONE ====="
      );

      return true;
    } catch (error) {
      console.error(
        "rebuildIndex failed:",
        error
      );

      return false;
    }
  }

  static isSearchableFile(
    file
  ) {
    return SearchableFileService.isSearchable(
      file
    );
  }

  static searchFiles(
    query
  ) {
    if (!query) {
      return [];
    }

    const lower =
      query.toLowerCase();

    const files =
      WorkspaceScopeService.getScopedFiles() ||
      [];

    return files
      .filter(
        file =>
          file &&
          (
            (file.name || "")
              .toLowerCase()
              .includes(lower) ||
            (file.path || "")
              .toLowerCase()
              .includes(lower)
          )
      )
      .map(file => ({
        type: "file",
        name:
          file.name ||
          "unknown",
        path:
          file.path || "",
        url:
          file.url || ""
      }));
  }

  static async readFullFile(
    path
  ) {
    return await FileContentService.readFullFile(
      path
    );
  }

  static async searchCode(
    query
  ) {
    if (!query) {
      return [];
    }

    const lower =
      query.toLowerCase();

    const files =
      WorkspaceScopeService
        .getScopedFiles()
        .filter(file =>
          this.isSearchableFile(
            file
          )
        );

    const matches = [];

    for (const file of files) {
      if (
        matches.length >=
        50
      ) {
        break;
      }

      try {
        const content =
          await FileContentService.fetchFileContent(
            file
          );

        if (!content) {
          continue;
        }

        const lines =
          content.split("\n");

        lines.forEach(
          (
            line,
            index
          ) => {
            if (
              matches.length >=
              50
            ) {
              return;
            }

            if (
              line
                .toLowerCase()
                .includes(
                  lower
                )
            ) {
              matches.push({
                type:
                  "code",
                file:
                  file.name,
                path:
                  file.path,
                line:
                  index + 1,
                text:
                  line.trim()
              });
            }
          }
        );
      } catch (error) {
        console.error(
          error
        );
      }
    }

    return matches;
  }

  static async readFile(
    path,
    startLine = 1,
    endLine = null
  ) {
    const file =
      FileContentService.openFile(
        path
      );

    if (!file) {
      return null;
    }

    const content =
      await FileContentService.fetchFileContent(
        file
      );

    if (!content) {
      return null;
    }

    const lines =
      content.split("\n");

    const start =
      Math.max(
        1,
        startLine
      );

    const end =
      endLine ||
      lines.length;

    const snippet =
      lines
        .slice(
          start - 1,
          end
        )
        .map(
          (
            line,
            index
          ) =>
            `${
              start +
              index
            }: ${line}`
        )
        .join("\n");

    return {
      file:
        file.name,
      path:
        file.path,
      startLine:
        start,
      endLine:
        end,
      content:
        snippet
    };
  }

  static async searchAllFiles(
    query
  ) {
    return await this.searchCode(
      query
    );
  }

  static openFile(
    path
  ) {
    return FileContentService.openFile(
      path
    );
  }
}