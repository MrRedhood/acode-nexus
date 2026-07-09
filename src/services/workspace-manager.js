export default class WorkspaceManager {
  static workspaceBuckets = {};

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

  static flattenBuckets() {
    return Object.values(
      this.workspaceBuckets
    ).flat();
  }

  static cleanupEmptyBuckets() {
    Object.keys(
      this.workspaceBuckets
    ).forEach(root => {
      const files =
        this.workspaceBuckets[root];

      if (
        !Array.isArray(files) ||
        files.length === 0
      ) {
        delete this.workspaceBuckets[
          root
        ];
      }
    });
  }

  static cleanupStaleBuckets(
    scannedRoots = []
  ) {
    Object.keys(
      this.workspaceBuckets
    ).forEach(root => {
      if (
        !scannedRoots.includes(root)
      ) {
        delete this.workspaceBuckets[
          root
        ];
      }
    });
  }

  static clearWorkspace(root) {
    if (!root) {
      return;
    }

    delete this.workspaceBuckets[root];
  }

  static clearAll() {
    this.workspaceBuckets = {};
  }

  static async scanWorkspace() {
    try {
      console.log(
        "===== WORKSPACE SCAN START ====="
      );

      if (
        typeof acode ===
        "undefined"
      ) {
        console.error(
          "acode not found"
        );
        return this.flattenBuckets();
      }

      if (!acode.require) {
        console.error(
          "acode.require missing"
        );
        return this.flattenBuckets();
      }

      let fileList;

      try {
        fileList =
          acode.require(
            "fileList"
          );
      } catch (error) {
        console.error(
          "fileList load failed:",
          error
        );
        return this.flattenBuckets();
      }

      if (
        typeof fileList !==
        "function"
      ) {
        console.error(
          "fileList not function"
        );
        return this.flattenBuckets();
      }

      const result =
        fileList();

      if (
        !Array.isArray(result)
      ) {
        console.error(
          "fileList returned non-array"
        );
        return this.flattenBuckets();
      }

      const scannedFiles =
        result.map(file => {
          try {
            return {
              ...file.toJSON(),
              raw: file
            };
          } catch {
            return {
              name: "unknown",
              path: "",
              url: "",
              raw: file
            };
          }
        });

      const roots = [
        ...new Set(
          scannedFiles
            .map(file =>
              this.extractRoot(
                file.path
              )
            )
            .filter(Boolean)
        )
      ];

      roots.forEach(root => {
        this.workspaceBuckets[
          root
        ] = scannedFiles.filter(
          file =>
            this.extractRoot(
              file.path
            ) === root
        );
      });

      this.cleanupStaleBuckets(
        roots
      );

      this.cleanupEmptyBuckets();

      console.log(
        "Workspace buckets:",
        Object.keys(
          this.workspaceBuckets
        )
      );

      console.log(
        "Total files:",
        this.flattenBuckets()
          .length
      );

      return this.flattenBuckets();
    } catch (error) {
      console.error(
        "scanWorkspace failed:",
        error
      );
      return this.flattenBuckets();
    }
  }

  static getFiles() {
    return this.flattenBuckets();
  }

  static searchFiles(query) {
    if (!query) {
      return [];
    }

    const lower =
      query.toLowerCase();

    return this.getFiles().filter(
      file =>
        (file.name || "")
          .toLowerCase()
          .includes(lower) ||
        (file.path || "")
          .toLowerCase()
          .includes(lower)
    );
  }

    static getWorkspaceRoots() {
    return Object.keys(
      this.workspaceBuckets
    );
  }

  static getWorkspace(
    root
  ) {
    return (
      this.workspaceBuckets[
        root
      ] || []
    );
  }

  static getWorkspaceFiles(
    root = null
  ) {
    if (!root) {
      return this.getFiles();
    }

    return (
      this.workspaceBuckets[
        root
      ] || []
    );
  }

  static getFileByPath(
    path
  ) {
    return this.getFiles().find(
      file =>
        file.path === path ||
        file.url === path
    );
  }

  static getFileByName(
    name
  ) {
    const lower =
      String(name)
        .toLowerCase();

    return this.getFiles().find(
      file =>
        String(
          file.name
        )
          .toLowerCase() ===
        lower
    );
  }

  static hasFile(
    path
  ) {
    return Boolean(
      this.getFileByPath(
        path
      )
    );
  }

  static getFolders() {
    return [
      ...new Set(
        this.getFiles()
          .map(file => {
            const path =
              file.path ||
              "";

            const index =
              path.lastIndexOf(
                "/"
              );

            return index === -1
              ? ""
              : path.slice(
                  0,
                  index
                );
          })
          .filter(Boolean)
      )
    ];
  }

  static getStats() {
    return {
      workspaces:
        this.getWorkspaceRoots()
          .length,

      files:
        this.getFiles()
          .length,

      folders:
        this.getFolders()
          .length
    };
  }

  static async refresh() {
    return await this.scanWorkspace();
  }

  static debugOpenFiles() {
    try {
      console.log(
        "===== OPEN FILE DEBUG START ====="
      );

      const file =
        editorManager.activeFile;

      if (!file) {
        console.log(
          "No active file"
        );
        return;
      }

      console.log(
        "ACTIVE FILE OBJECT:",
        file
      );

      [
        "filename",
        "name",
        "uri",
        "location",
        "id"
      ].forEach(prop => {
        try {
          console.log(
            prop + ":",
            file[prop]
          );
        } catch (e) {
          console.log(
            prop +
              " read failed",
            e
          );
        }
      });

      console.log(
        "===== OPEN FILE DEBUG END ====="
      );
    } catch (err) {
      console.error(err);
    }
  }

  static async debug() {
    try {
      console.log(
        "===== WORKSPACE DEBUG START ====="
      );

      await this.scanWorkspace();

      console.log(
        "Buckets:",
        this.workspaceBuckets
      );

      console.log(
        "===== WORKSPACE DEBUG END ====="
      );
    } catch (err) {
      console.error(err);
    }
  }
}