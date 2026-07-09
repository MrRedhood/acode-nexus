import WorkspaceScopeService from "./workspace-scope-service.js";
import WorkspaceSummaryService from "./workspace-summary-service.js";
import WorkspaceSymbolIndexService from "./workspace-symbol-index-service.js";
import WorkspaceQueryService from "./workspace-query-service.js";

export default class WorkspaceContextService {
  static currentContext =
    null;

  static async build(
    force = false
  ) {
    if (
      !force &&
      this.currentContext
    ) {
      return this.currentContext;
    }

    const workspace =
      WorkspaceScopeService.getSelectedWorkspace();

    const files =
      WorkspaceScopeService.getScopedFiles();

    const summary =
      WorkspaceSummaryService.getSummary() ||
      WorkspaceSummaryService.buildSummary();

    let symbols =
      WorkspaceSymbolIndexService.getSymbols();

    if (!symbols.length) {
      symbols =
        await WorkspaceSymbolIndexService.buildIndex();
    }

    this.currentContext = {
      workspace,
      files,
      summary,
      symbols,
      generatedAt:
        Date.now()
    };

    return this.currentContext;
  }

  static async refresh() {
    WorkspaceSummaryService.clear();
    WorkspaceSymbolIndexService.clear();

    this.currentContext =
      null;

    return await this.build(
      true
    );
  }

  static clear() {
    this.currentContext =
      null;
  }

  static async get() {
    return await this.build();
  }

  static async getWorkspace() {
    return (
      await this.build()
    ).workspace;
  }

  static async getFiles() {
    return (
      await this.build()
    ).files;
  }

  static async getSummary() {
    return (
      await this.build()
    ).summary;
  }

  static async getSymbols() {
    return (
      await this.build()
    ).symbols;
  }

  static async getPromptSummary() {
    await this.build();

    return WorkspaceSummaryService.buildPromptSummary();
  }

  static async findSymbol(
    name
  ) {
    await this.build();

    return WorkspaceSymbolIndexService.findExact(
      name
    );
  }

  static async findSimilarSymbols(
    query
  ) {
    await this.build();

    return WorkspaceSymbolIndexService.findSimilar(
      query
    );
  }

  static async findDefinition(
    symbol
  ) {
    await this.build();

    return WorkspaceQueryService.findDefinition(
      symbol
    );
  }

  static async findReferences(
    symbol
  ) {
    await this.build();

    return WorkspaceQueryService.findReferences(
      symbol
    );
  }
}