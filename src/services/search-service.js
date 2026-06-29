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

  static toRawGithubUrl(file) {
    if (
      !file ||
      !file.path
    ) {
      return null;
    }

    const path =
      file.path;

    const parts =
      path.split("/");

    if (
      parts.length < 4
    ) {
      return null;
    }

    const owner =
      parts[0];

    const repo =
      parts[1];

    const branch =
      parts[2];

    const filePath =
      parts.slice(3).join("/");

    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
  }

  static async searchCode(query) {
    if (!query) {
      return [];
    }

    const lower =
      query.toLowerCase();

    const files =
      WorkspaceManager
        .getFiles()
        .filter(file => {
          const name =
            file.name || "";

          return (
            name.endsWith(".js") ||
            name.endsWith(".json") ||
            name.endsWith(".css") ||
            name.endsWith(".md")
          );
        });

    const matches = [];

    for (const file of files) {
      if (
        matches.length >= 50
      ) {
        break;
      }

      try {
        const url =
          this.toRawGithubUrl(
            file
          );

        if (!url) {
          continue;
        }

        const response =
          await fetch(url);

        if (!response.ok) {
          continue;
        }

        const content =
          await response.text();

        const lines =
          content.split("\n");

        lines.forEach(
          (line, index) => {
            if (
              matches.length >= 50
            ) {
              return;
            }

            if (
              line
                .toLowerCase()
                .includes(lower)
            ) {
              matches.push({
                type: "code",
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
          "searchCode file failed:",
          file.path,
          error
        );
      }
    }

    return matches;
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