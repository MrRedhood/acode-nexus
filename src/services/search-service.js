import WorkspaceManager from "./workspace-manager.js";

export default class SearchService {
  static escapeRegex(text) {
    return text.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
  }

  static createTokenRegex(query) {
    const escaped =
      this.escapeRegex(
        query.toLowerCase()
      );

    return new RegExp(
      `(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`,
      "i"
    );
  }

  static searchFiles(query) {
    if (!query) {
      return [];
    }

    const regex =
      this.createTokenRegex(
        query
      );

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
          regex.test(name) ||
          regex.test(path)
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

      const regex =
        this.createTokenRegex(
          query
        );

      const matches = [];

      lines.forEach(
        (line, index) => {
          if (
            regex.test(line)
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
          .includes(lower)
      ) || null
    );
  }
}