import WorkspaceManager from "./workspace-manager.js";

export default class WorkspaceScopeService {
  static selectedRoot = null;

  static extractRoot(path) {
    if (!path) {
      return null;
    }

    const parts =
      path.split("/");

    if (
      parts[0] === "Acode"
    ) {
      return "Acode";
    }

    if (
      parts.length >= 3
    ) {
      return parts
        .slice(0, 3)
        .join("/");
    }

    return parts[0];
  }

  static getRoots() {
    const files =
      WorkspaceManager.getFiles();

    const roots = [
      ...new Set(
        files
          .filter(
            file => file.path
          )
          .map(file =>
            this.extractRoot(
              file.path
            )
          )
      )
    ];

    return roots;
  }

  static setSelectedRoot(
    root
  ) {
    this.selectedRoot =
      root;
  }

  static getSelectedRoot() {
    if (
      this.selectedRoot
    ) {
      return this.selectedRoot;
    }

    const roots =
      this.getRoots();

    if (roots.length) {
      this.selectedRoot =
        roots[0];
    }

    return this.selectedRoot;
  }

  static getScopedFiles() {
    const files =
      WorkspaceManager.getFiles();

    const root =
      this.getSelectedRoot();

    if (!root) {
      return files;
    }

    return files.filter(
      file => {
        if (!file.path) {
          return false;
        }

        if (
          root === "Acode"
        ) {
          return file.path.startsWith(
            "Acode/"
          );
        }

        return file.path.startsWith(
          root + "/"
        );
      }
    );
  }
}