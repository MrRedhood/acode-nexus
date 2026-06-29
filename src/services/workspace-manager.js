export default class WorkspaceManager {
  static workspaceFiles = [];

  static async scanWorkspace() {
    try {
      console.log(
        "===== WORKSPACE SCAN START ====="
      );

      this.workspaceFiles = [];

      if (
        typeof acode === "undefined"
      ) {
        console.error(
          "acode not found"
        );
        return [];
      }

      if (!acode.require) {
        console.error(
          "acode.require missing"
        );
        return [];
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
        return [];
      }

      if (
        typeof fileList !==
        "function"
      ) {
        console.error(
          "fileList not function"
        );
        return [];
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
        return [];
      }

      this.workspaceFiles =
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

      console.log(
        "Workspace files:",
        this.workspaceFiles.length
      );

      return this.workspaceFiles;
    } catch (error) {
      console.error(
        "scanWorkspace failed:",
        error
      );
      return [];
    }
  }

  static getFiles() {
    return this.workspaceFiles;
  }

  static searchFiles(query) {
    if (!query) {
      return [];
    }

    const lower =
      query.toLowerCase();

    return this.workspaceFiles.filter(
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

      console.log(
        "EDITOR FILES:",
        editorManager.files
      );

      if (
        editorManager.files &&
        editorManager.files.length
      ) {
        const file =
          editorManager.files[0];

        console.log(
          "FIRST OPEN FILE:",
          file
        );

        console.log(
          "OWN PROPS:",
          Object.getOwnPropertyNames(
            file
          )
        );

        const proto =
          Object.getPrototypeOf(
            file
          );

        if (proto) {
          console.log(
            "PROTO PROPS:",
            Object.getOwnPropertyNames(
              proto
            )
          );
        }

        for (const key in file) {
          try {
            console.log(
              "ENUM KEY:",
              key,
              file[key]
            );
          } catch {}
        }
      }

      console.log(
        "ACTIVE FILE:",
        editorManager.activeFile
      );

      if (
        editorManager.activeFile
      ) {
        console.log(
          "ACTIVE FILE PROPS:",
          Object.getOwnPropertyNames(
            editorManager.activeFile
          )
        );

        const proto =
          Object.getPrototypeOf(
            editorManager.activeFile
          );

        if (proto) {
          console.log(
            "ACTIVE FILE PROTO PROPS:",
            Object.getOwnPropertyNames(
              proto
            )
          );
        }
      }

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
        "editorManager props:",
        Object.getOwnPropertyNames(
          editorManager
        )
      );

      console.log(
        "acode props:",
        Object.getOwnPropertyNames(
          acode
        )
      );

      const suspicious =
        Object.keys(window).filter(
          key =>
            key
              .toLowerCase()
              .includes("git") ||
            key
              .toLowerCase()
              .includes("repo") ||
            key
              .toLowerCase()
              .includes("file")
        );

      console.log(
        "acode suspicious:",
        suspicious
      );

      console.log(
        "===== WORKSPACE DEBUG END ====="
      );
    } catch (err) {
      console.error(err);
    }
  }
}