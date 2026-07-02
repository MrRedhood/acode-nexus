import WorkspaceManager from "./workspace-manager.js";

export default class WorkspaceScopeService {
  static selectedRoot = null;

  static extractRoot(path) {
    if (!path) {
      return null;
    }

    const parts = path.split("/");

    if (parts[0] === "Acode") {
      return "Acode";
    }

    if (parts.length >= 3) {
      return parts.slice(0, 3).join("/");
    }

    return parts[0];
  }

  static getDisplayName(root) {
    if (!root) {
      return "Unknown";
    }

    if (root === "Acode") {
      return "Acode";
    }

    const parts = root.split("/");

    if (parts.length >= 2) {
      return parts[1];
    }

    return root;
  }

  static getWorkspaceType(root) {
    if (!root) {
      return "unknown";
    }

    if (root === "Acode") {
      return "local";
    }

    return "github";
  }

  static getRoots() {
    const files =
      WorkspaceManager.getFiles() || [];

    const roots = [
      ...new Set(
        files
          .filter(
            file =>
              file &&
              file.path
          )
          .map(file =>
            this.extractRoot(
              file.path
            )
          )
          .filter(Boolean)
      )
    ];

    return roots;
  }

  static getWorkspaceObjects() {
    return this.getRoots().map(
      root => ({
        id: root,
        name:
          this.getDisplayName(
            root
          ),
        type:
          this.getWorkspaceType(
            root
          )
      })
    );
  }

  static setSelectedRoot(root) {
    this.selectedRoot = root;

    try {
      localStorage.setItem(
        "nexus_workspace_root",
        root
      );
    } catch (error) {
      console.error(error);
    }
  }

  static getSelectedRoot() {
    const roots =
      this.getRoots();

    if (!roots.length) {
      this.selectedRoot =
        null;
      return null;
    }

    if (
      this.selectedRoot &&
      roots.includes(
        this.selectedRoot
      )
    ) {
      return this.selectedRoot;
    }

    try {
      const saved =
        localStorage.getItem(
          "nexus_workspace_root"
        );

      if (
        saved &&
        roots.includes(saved)
      ) {
        this.selectedRoot =
          saved;
        return saved;
      }
    } catch (error) {
      console.error(error);
    }

    this.selectedRoot =
      roots[0];

    try {
      localStorage.setItem(
        "nexus_workspace_root",
        this.selectedRoot
      );
    } catch (error) {
      console.error(error);
    }

    return this.selectedRoot;
  }

  static getSelectedWorkspace() {
    const root =
      this.getSelectedRoot();

    if (!root) {
      return null;
    }

    return {
      id: root,
      name:
        this.getDisplayName(
          root
        ),
      type:
        this.getWorkspaceType(
          root
        )
    };
  }

  static getScopedFiles() {
    const files =
      WorkspaceManager.getFiles() || [];

    const root =
      this.getSelectedRoot();

    if (!root) {
      return files;
    }

    return files.filter(
      file => {
        if (
          !file ||
          !file.path
        ) {
          return false;
        }

        if (root === "Acode") {
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