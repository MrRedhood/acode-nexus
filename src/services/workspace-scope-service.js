import WorkspaceManager from "./workspace-manager.js";

export default class WorkspaceScopeService {
  static selectedRoot = null;

  static getRoots() {
    const files =
      WorkspaceManager.getFiles();

    const roots = [
      ...new Set(
        files
          .filter(
            file => file.path
          )
          .map(file => {
            const parts =
              file.path.split("/");

            if (
              parts.length >= 3
            ) {
              return parts
                .slice(0, 3)
                .join("/");
            }

            return parts[0];
          })
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
      file =>
        file.path &&
        file.path.startsWith(
          root + "/"
        )
    );
  }
}