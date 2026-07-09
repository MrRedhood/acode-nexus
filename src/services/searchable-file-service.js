export default class SearchableFileService {
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

  static isSearchable(file) {
    if (!file) {
      return false;
    }

    if (file.isDirectory) {
      return false;
    }

    if (
      file.size &&
      file.size >
        this.MAX_FILE_SIZE
    ) {
      return false;
    }

    const mime =
      (file.mime || "")
        .toLowerCase();

    if (
      mime.startsWith(
        "image/"
      ) ||
      mime.startsWith(
        "video/"
      ) ||
      mime.startsWith(
        "audio/"
      ) ||
      mime.startsWith(
        "font/"
      )
    ) {
      return false;
    }

    if (
      mime.includes("zip") ||
      mime.includes(
        "octet-stream"
      ) ||
      mime.includes("pdf")
    ) {
      return false;
    }

    if (
      mime.startsWith(
        "text/"
      )
    ) {
      return true;
    }

    const name =
      (file.name || "")
        .toLowerCase();

    if (
      name ===
        "dockerfile" ||
      name === "makefile"
    ) {
      return true;
    }

    if (
      name.includes(
        ".min."
      ) ||
      name.includes(
        ".bundle."
      ) ||
      name.includes(
        "package-lock"
      ) ||
      name.includes(
        "pnpm-lock"
      ) ||
      name.includes(
        "yarn.lock"
      )
    ) {
      return false;
    }

    for (const ext of this.searchableExtensions) {
      if (
        name.endsWith(ext)
      ) {
        return true;
      }
    }

    return false;
  }
}