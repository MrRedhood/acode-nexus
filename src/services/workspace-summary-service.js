import IndexingService from "./indexing-service.js";
import WorkspaceSummaryBuilderService from "./workspace-summary-builder-service.js";
import WorkspaceSummaryPromptService from "./workspace-summary-prompt-service.js";

export default class WorkspaceSummaryService {
  static currentSummary =
    null;

  static buildSummary() {
    const index =
      IndexingService.getIndex();

    if (!index) {
      return null;
    }

    const summary =
      WorkspaceSummaryBuilderService.buildSummary(
        index
      );

    this.currentSummary =
      summary;

    console.log(
      "[WORKSPACE SUMMARY]",
      summary
    );

    return summary;
  }

  static getSummary() {
    return (
      this.currentSummary
    );
  }

  static buildPromptSummary() {
    const summary =
      this.getSummary() ||
      this.buildSummary();

    if (!summary) {
      return "";
    }

    return WorkspaceSummaryPromptService.buildPrompt(
      summary
    );
  }

  static clear() {
    this.currentSummary =
      null;
  }
}