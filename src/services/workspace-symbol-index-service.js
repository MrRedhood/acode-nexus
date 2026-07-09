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
    this.clear();

    const files =
      WorkspaceScopeService.getScopedFiles()
        .filter(file =>
          SearchService.isSearchableFile(
            file
          )
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
          this.register({
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

  static register(
    symbol
  ) {
    this.symbols.push(
      symbol
    );

    this.symbolMap.set(
      symbol.name,
      symbol
    );

    const list =
      this.fileMap.get(
        symbol.path
      ) || [];

    list.push(symbol);

    this.fileMap.set(
      symbol.path,
      list
    );
  }

  static clear() {
    this.symbols = [];

    this.symbolMap.clear();

    this.fileMap.clear();
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
      this.symbolMap.get(
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

    this.fileMap.delete(
      path
    );

    this.symbolMap =
      new Map(
        this.symbols.map(
          symbol => [
            symbol.name,
            symbol
          ]
        )
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
      this.register({
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

  static getFileSymbols(
    path
  ) {
    return [
      ...(
        this.fileMap.get(
          path
        ) || []
      )
    ];
  }

  static hasSymbol(
    name
  ) {
    return this.symbolMap.has(
      name
    );
  }

  static count() {
    return this.symbols.length;
  }
}