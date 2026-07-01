import WorkspaceScopeService from "./workspace-scope-service.js";

export default class IndexingService {
  static currentIndex = null;

  static async buildIndex() {
    const files =
      WorkspaceScopeService.getScopedFiles();

    const workspace =
      WorkspaceScopeService.getSelectedRoot();

    const index = {
      workspace,
      totalFiles: files.length,
      generatedAt:
        Date.now(),
      files: files.map(file => ({
        name:
          file.name ||
          "unknown",

        path:
          file.path || "",

        extension:
          this.getExtension(
            file.name
          ),

        size:
          file.size || 0
      }))
    };

    this.currentIndex =
      index;

    console.log(
      "[INDEX BUILT]",
      index
    );

    return index;
  }

  static getIndex() {
    return (
      this.currentIndex
    );
  }

  static getExtension(name) {
    if (!name) {
      return "";
    }

    const parts =
      name.split(".");

    if (
      parts.length < 2
    ) {
      return "";
    }

    return parts.pop();
  }
}