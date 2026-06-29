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
    if (!file) {
      return null;
    }

    if (file.uri) {
      const match =
        file.uri.match(
          /^gh:\/\/repo\/([^/]+)\/([^@]+)@([^/]+)\/(.+)$/
        );

      if (match) {
        const owner =
          match[1];
        const repo =
          match[2];
        const branch =
          match[3];
        const filePath =
          match[4];

        return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      }
    }

    if (!file.path) {
      return null;
    }

    const parts =
      file.path.split("/");

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
            (
              file.name || ""
            ).toLowerCase();

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
              const start =
                Math.max(
                  0,
                  index - 8
                );

              const end =
                Math.min(
                  lines.length,
                  index + 9
                );

              const snippet =
                lines
                  .slice(
                    start,
                    end
                  )
                  .map(
                    (
                      snippetLine,
                      snippetIndex
                    ) =>
                      `${
                        start +
                        snippetIndex +
                        1
                      }: ${snippetLine}`
                  )
                  .join("\n");

              matches.push({
                type: "code",
                file:
                  file.name,
                path:
                  file.path,
                line:
                  index + 1,
                text:
                  line.trim(),
                snippet
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

  static async readFile(
    path,
    startLine = 1,
    endLine = null
  ) {
    const file =
      this.openFile(path);

    if (!file) {
      return null;
    }

    const url =
      this.toRawGithubUrl(file);

    if (!url) {
      return null;
    }

    try {
      const response =
        await fetch(url);

      if (!response.ok) {
        return null;
      }

      const content =
        await response.text();

      const lines =
        content.split("\n");

      const start =
        Math.max(
          1,
          startLine
        );

      const end =
        endLine ||
        Math.min(
          start + 199,
          lines.length
        );

      const snippet =
        lines
          .slice(
            start - 1,
            end
          )
          .map(
            (line, index) =>
              `${start + index}: ${line}`
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
    } catch (error) {
      console.error(
        "readFile failed:",
        error
      );
      return null;
    }
  }

  static async searchAllFiles(
    query
  ) {
    return await this.searchCode(
      query
    );
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