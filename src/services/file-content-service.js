export default class FileContentService {
  static fileCache =
    new Map();

  static MAX_FILE_SIZE =
    4 * 1024 * 1024;

  static toRawGithubUrl(
    file
  ) {
    if (!file) {
      return null;
    }

    if (file.url) {
      const match =
        file.url.match(
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
      parts
        .slice(3)
        .join("/");

    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
  }

  static readFromOpenEditor(
    file
  ) {
    try {
      if (!file) {
        return null;
      }

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
        (
          file.name || ""
        ).toLowerCase();

      const sameFile =
        activeLower ===
          targetLower ||
        activeLower.includes(
          targetLower
        ) ||
        targetLower.includes(
          activeLower
        ) ||
        activeLower.endsWith(
          fileNameLower
        );

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
      console.error(
        error
      );

      return null;
    }
  }

  static async readLocalFile(
    file
  ) {
    try {
      const fs =
        acode.require(
          "fs"
        );

      const content =
        await fs(
          file.url
        ).readFile(
          "utf-8"
        );

      return (
        content || null
      );
    } catch (error) {
      console.error(
        error
      );

      return null;
    }
  }

  static async fetchFileContent(
    file
  ) {
    if (!file) {
      return null;
    }

    const cacheKey =
      file.path ||
      file.name;

    const editorContent =
      this.readFromOpenEditor(
        file
      );

    if (
      editorContent
    ) {
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
      const content =
        await this.readLocalFile(
          file
        );

      if (content) {
        this.fileCache.set(
          cacheKey,
          content
        );

        return content;
      }

      return null;
    }

    const url =
      this.toRawGithubUrl(
        file
      );

    if (!url) {
      return null;
    }

    try {
      const response =
        await fetch(
          url
        );

      if (
        !response.ok
      ) {
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
      console.error(
        error
      );

      return null;
    }
  }

  static invalidate(
    path
  ) {
    if (!path) {
      return;
    }

    this.fileCache.delete(
      path
    );
  }

  static clearCache() {
    this.fileCache.clear();
  }
}