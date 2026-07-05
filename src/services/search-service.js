import WorkspaceScopeService from "./workspace-scope-service.js";
import WorkspaceManager from "./workspace-manager.js";

export default class SearchService {
  static fileCache = new Map();

  static MAX_FILE_SIZE =
    4 * 1024 * 1024;

  static searchableExtensions =
    new Set([
      ".js",
      ".mjs",
      ".cjs",
      ".ts",
      ".tsx",
      ".jsx",
      ".html",
      ".htm",
      ".css",
      ".scss",
      ".sass",
      ".less",
      ".json",
      ".jsonc",
      ".yaml",
      ".yml",
      ".toml",
      ".ini",
      ".env",
      ".xml",
      ".kt",
      ".kts",
      ".java",
      ".dart",
      ".gradle",
      ".properties",
      ".py",
      ".pyw",
      ".c",
      ".h",
      ".cpp",
      ".cc",
      ".cxx",
      ".hpp",
      ".rs",
      ".go",
      ".zig",
      ".php",
      ".rb",
      ".cs",
      ".swift",
      ".sh",
      ".bash",
      ".zsh",
      ".ps1",
      ".bat",
      ".sql",
      ".md",
      ".txt",
      ".rst",
      ".lua",
      ".r",
      ".scala",
      ".pl",
      ".pm",
      ".vue",
      ".svelte",
      ".prompt"
    ]);

  static async rebuildIndex() {
    try {
      console.log(
        "===== SEARCH REBUILD START ====="
      );

      this.fileCache.clear();

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

  static isSearchableFile(file) {
    if (!file) return false;
    if (file.isDirectory) return false;

    if (
      file.size &&
      file.size > this.MAX_FILE_SIZE
    ) {
      return false;
    }

    const mime =
      (file.mime || "")
        .toLowerCase();

    if (
      mime.startsWith("image/") ||
      mime.startsWith("video/") ||
      mime.startsWith("audio/") ||
      mime.startsWith("font/")
    ) {
      return false;
    }

    if (
      mime.includes("zip") ||
      mime.includes("octet-stream") ||
      mime.includes("pdf")
    ) {
      return false;
    }

    if (
      mime.startsWith("text/")
    ) {
      return true;
    }

    const name =
      (file.name || "")
        .toLowerCase();

    if (
      name === "dockerfile" ||
      name === "makefile"
    ) {
      return true;
    }

    if (
      name.includes(".min.") ||
      name.includes(".bundle.") ||
      name.includes("package-lock") ||
      name.includes("pnpm-lock") ||
      name.includes("yarn.lock")
    ) {
      return false;
    }

    for (const ext of this.searchableExtensions) {
      if (name.endsWith(ext)) {
        return true;
      }
    }

    return false;
  }

  static searchFiles(query) {
    if (!query) return [];

    const lower =
      query.toLowerCase();

    const files =
      WorkspaceScopeService.getScopedFiles() || [];

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

  static toRawGithubUrl(file) {
    if (!file) return null;

    if (file.url) {
      const match =
        file.url.match(
          /^gh:\/\/repo\/([^/]+)\/([^@]+)@([^/]+)\/(.+)$/
        );

      if (match) {
        const owner = match[1];
        const repo = match[2];
        const branch = match[3];
        const filePath = match[4];

        return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      }
    }

    if (!file.path) {
      return null;
    }

    const parts =
      file.path.split("/");

    if (parts.length < 4) {
      return null;
    }

    const owner = parts[0];
    const repo = parts[1];
    const branch = parts[2];
    const filePath =
      parts.slice(3).join("/");

    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
  }

  static readFromOpenEditor(file) {
    try {
      if (!file) return null;

      const activeFile =
        editorManager?.activeFile;

      if (!activeFile) {
        return null;
      }

      const activePath =
        activeFile.uri ||
        activeFile.filename ||
        activeFile.name ||
        "";

      const targetPath =
        file.url ||
        file.path ||
        file.name ||
        "";

      const activeLower =
        String(activePath)
          .toLowerCase();

      const targetLower =
        String(targetPath)
          .toLowerCase();

      const fileNameLower =
        (file.name || "")
          .toLowerCase();

      const sameFile =
        activeLower === targetLower ||
        activeLower.includes(targetLower) ||
        targetLower.includes(activeLower) ||
        activeLower.endsWith(fileNameLower);

      if (!sameFile) {
        return null;
      }

      const content =
        editorManager?.editor
          ?.session
          ?.getValue?.();

      if (
        typeof content ===
          "string" &&
        content.length > 0
      ) {
        return content;
      }

      return null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static async readLocalFile(file) {
    try {
      const fs =
        acode.require("fs");

      const content =
        await fs(file.url)
          .readFile("utf-8");

      return content || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static async fetchFileContent(file) {
    if (!file) return null;

    const cacheKey =
      file.path || file.name;

    const editorContent =
      this.readFromOpenEditor(file);

    if (editorContent) {
      return editorContent;
    }

    if (
      this.fileCache.has(
        cacheKey
      )
    ) {
      return this.fileCache.get(
        cacheKey
      );
    }

    if (
      file.url &&
      file.url.startsWith(
        "content://"
      )
    ) {
      const localContent =
        await this.readLocalFile(
          file
        );

      if (localContent) {
        this.fileCache.set(
          cacheKey,
          localContent
        );
        return localContent;
      }

      return null;
    }

    const url =
      this.toRawGithubUrl(file);

    if (!url) return null;

    try {
      const response =
        await fetch(url);

      if (!response.ok) {
        return null;
      }

      const content =
        await response.text();

      this.fileCache.set(
        cacheKey,
        content
      );

      return content;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static async readFullFile(path) {
    const file =
      this.openFile(path);

    if (!file) return null;

    return await this.fetchFileContent(file);
  }

  static async searchCode(query) {
    if (!query) return [];

    const lower =
      query.toLowerCase();

    const files =
      WorkspaceScopeService
        .getScopedFiles()
        .filter(file =>
          this.isSearchableFile(file)
        );

    const matches = [];

    for (const file of files) {
      if (matches.length >= 50) {
        break;
      }

      try {
        const content =
          await this.fetchFileContent(
            file
          );

        if (!content) continue;

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
              line.toLowerCase()
                .includes(lower)
            ) {
              matches.push({
                type: "code",
                file: file.name,
                path: file.path,
                line: index + 1,
                text: line.trim()
              });
            }
          }
        );
      } catch (error) {
        console.error(error);
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

    if (!file) return null;

    const content =
      await this.fetchFileContent(file);

    if (!content) return null;

    const lines =
      content.split("\n");

    const start =
      Math.max(1, startLine);

    const end =
      endLine || lines.length;

    const snippet =
      lines
        .slice(start - 1, end)
        .map(
          (line, index) =>
            `${start + index}: ${line}`
        )
        .join("\n");

    return {
      file: file.name,
      path: file.path,
      startLine: start,
      endLine: end,
      content: snippet
    };
  }

  static async searchAllFiles(query) {
    return await this.searchCode(query);
  }

  static openFile(path) {
    if (!path) return null;

    const files =
      WorkspaceScopeService.getScopedFiles();

    const lower =
      path.toLowerCase();

    return (
      files.find(
        file =>
          (file.name || "")
            .toLowerCase() === lower ||
          (file.path || "")
            .toLowerCase()
            .endsWith(lower) ||
          (file.name || "")
            .toLowerCase()
            .includes(lower) ||
          (file.path || "")
            .toLowerCase()
            .includes(lower)
      ) || null
    );
  }
}