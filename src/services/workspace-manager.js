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
    ).flatMap(
      bucket => bucket.files || []
    );
  }

  static cleanupInvalidBuckets() {
    Object.keys(
      this.workspaceBuckets
    ).forEach(root => {
      const bucket =
        this.workspaceBuckets[
          root
        ];

      if (
        !bucket ||
        !Array.isArray(
          bucket.files
        )
      ) {
        delete this
          .workspaceBuckets[
          root
        ];
        return;
      }

      bucket.files =
        bucket.files.filter(
          file =>
            file &&
            file.path
        );

      if (
        bucket.files.length === 0
      ) {
        console.log(
          "Removing empty workspace:",
          root
        );

        delete this
          .workspaceBuckets[
          root
        ];
      }
    });
  }

  static removeWorkspace(root) {
    if (!root) {
      return;
    }

    if (
      this.workspaceBuckets[
        root
      ]
    ) {
      delete this
        .workspaceBuckets[
        root
      ];

      console.log(
        "Workspace removed:",
        root
      );
    }
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
        !Array.isArray(
          result
        )
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
              name:
                "unknown",
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

      const now =
        Date.now();

      roots.forEach(root => {
        const files =
          scannedFiles.filter(
            file =>
              this.extractRoot(
                file.path
              ) === root
          );

        this.workspaceBuckets[
          root
        ] = {
          files,
          lastSeen: now
        };
      });

      this.cleanupInvalidBuckets();

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