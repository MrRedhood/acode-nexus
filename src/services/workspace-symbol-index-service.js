import WorkspaceScopeService from "./workspace-scope-service.js";
import SearchService from "./search-service.js";
import LiveBufferSymbolService from "./live-buffer-symbol-service.js";

export default class WorkspaceSymbolIndexService {
  static symbols = [];

static symbolMap =
  new Map();

static fileMap =
  new Map();

  static async buildIndex() {
    this.symbols = [];

    const files =
      WorkspaceScopeService.getScopedFiles()
        .filter(file =>
          SearchService.isSearchableFile(file)
        );

    console.log(
      "[Workspace Index] Files:",
      files.length
    );

    for (const file of files) {
      try {
        const content =
          await SearchService.readFullFile(
            file.path
          );

        if (!content) {
          continue;
        }

        const symbols =
          LiveBufferSymbolService.findAllSymbols(
            content
          );

        for (const symbol of symbols) {
          this.symbols.push({
            ...symbol,

            file:
              file.name,

            path:
              file.path,

            url:
              file.url
          });
        }
      } catch (error) {
        console.error(
          "[Workspace Index]",
          file.path,
          error
        );
      }
    }

    console.log(
      "[Workspace Index] Indexed:",
      this.symbols.length,
      "symbols"
    );

    return this.symbols;
  }

  static clear() {
    this.symbols = [];
  }

  static getSymbols() {
    return [
      ...this.symbols
    ];
  }

  static findExact(
    name
  ) {
    if (!name) {
      return null;
    }

    return (
      this.symbols.find(
        symbol =>
          symbol.name ===
          name
      ) || null
    );
  }

  static findSimilar(
    query
  ) {
    if (!query) {
      return [];
    }

    const lower =
      query.toLowerCase();

    return this.symbols.filter(
      symbol =>
        symbol.name
          .toLowerCase()
          .includes(lower) ||
        symbol.file
          .toLowerCase()
          .includes(lower) ||
        symbol.path
          .toLowerCase()
          .includes(lower)
    );
  }

  static async refreshFile(
    path
  ) {
    if (!path) {
      return;
    }

    this.symbols =
      this.symbols.filter(
        symbol =>
          symbol.path !==
          path
      );

    const content =
      await SearchService.readFullFile(
        path
      );

    if (!content) {
      return;
    }

    const file =
      WorkspaceScopeService
        .getScopedFiles()
        .find(
          item =>
            item.path ===
            path
        );

    if (!file) {
      return;
    }

    const symbols =
      LiveBufferSymbolService.findAllSymbols(
        content
      );

    for (const symbol of symbols) {
      this.symbols.push({
        ...symbol,

        file:
          file.name,

        path:
          file.path,

        url:
          file.url
      });
    }
  }
}