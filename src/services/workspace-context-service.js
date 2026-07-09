import WorkspaceScopeService from "./workspace-scope-service.js";
import WorkspaceSummaryService from "./workspace-summary-service.js";
import WorkspaceSymbolIndexService from "./workspace-symbol-index-service.js";

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
    const context =
      await this.build();

    return context.workspace;
  }

  static async getFiles() {
    const context =
      await this.build();

    return context.files;
  }

  static async getSummary() {
    const context =
      await this.build();

    return context.summary;
  }

  static async getSymbols() {
    const context =
      await this.build();

    return context.symbols;
  }

  static async getPromptSummary() {
    await this.build();

    return WorkspaceSummaryService.buildPromptSummary();
  }
}