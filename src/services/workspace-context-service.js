import WorkspaceScopeService from "./workspace-scope-service.js";
import WorkspaceSummaryService from "./workspace-summary-service.js";
import WorkspaceSymbolIndexService from "./workspace-symbol-index-service.js";

export default class WorkspaceContextService {
  static async build() {
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

    return {
      workspace,
      files,
      summary,
      symbols
    };
  }

  static async getPromptSummary() {
    await this.build();

    return WorkspaceSummaryService.buildPromptSummary();
  }

  static async refresh() {
    WorkspaceSummaryService.clear();
    WorkspaceSymbolIndexService.clear();

    return await this.build();
  }
}