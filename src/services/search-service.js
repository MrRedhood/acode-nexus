import WorkspaceManager from "./workspace-manager.js";

export default class SearchService {
  static searchFiles(query) {
    if (!query) {
      return [];
    }

    const lower =
      query.toLowerCase();

    const files =
      WorkspaceManager.getFiles();

    return files
      .filter(file => {
        const name =
          (
            file.name || ""
          ).toLowerCase();

        const path =
          (
            file.path || ""
          ).toLowerCase();

        return (
          name.includes(lower) ||
          path.includes(lower)
        );
      })
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

  static searchCode(query) {
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
              type: "code",
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
        "searchCode failed:",
        error
      );

      return [];
    }
  }

  static openFile(path) {
    if (!path) {
      return null;
    }

    const files =
      WorkspaceManager.getFiles();

    const lower =
      path.toLowerCase();

    return (
      files.find(file =>
        (
          file.path || ""
        )
          .toLowerCase()
          .includes(lower) ||
        (
          file.name || ""
        )
          .toLowerCase()
          .includes(lower)
      ) || null
    );
  }
}