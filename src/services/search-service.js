import WorkspaceManager from "./workspace-manager.js";

export default class SearchService {
  static searchWorkspace(query) {
    if (!query) {
      return [];
    }

    const files =
      WorkspaceManager.searchFiles(
        query
      );

    return files.map(file => ({
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

  static searchCurrentFile(
    query
  ) {
    if (!query) {
      return [];
    }

    if (
      typeof editorManager ===
      "undefined"
    ) {
      return [];
    }

    try {
      const content =
        editorManager.editor.getValue();

      const lines =
        content.split("\n");

      const lower =
        query.toLowerCase();

      const matches = [];

      lines.forEach(
        (line, index) => {
          if (
            line
              .toLowerCase()
              .includes(lower)
          ) {
            matches.push({
              type:
                "content",
              line:
                index + 1,
              text:
                line.trim()
            });
          }
        }
      );

      return matches;
    } catch (error) {
      console.error(
        "searchCurrentFile failed:",
        error
      );

      return [];
    }
  }

  static search(query) {
    return {
      workspace:
        this.searchWorkspace(
          query
        ),
      currentFile:
        this.searchCurrentFile(
          query
        )
    };
  }
}