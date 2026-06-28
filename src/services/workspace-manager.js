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

  static async debug() {
  try {
    console.log(
      "===== WORKSPACE DEBUG START ====="
    );

    await this.scanWorkspace();

    console.log(
      "editorManager:",
      typeof editorManager
    );

    if (
      typeof editorManager !==
      "undefined"
    ) {
      console.log(
        "ACTIVE FILE:",
        editorManager.activeFile
      );

      if (
        editorManager.activeFile
      ) {
        try {
          console.log(
            "ACTIVE FILE PROPS:",
            Object.getOwnPropertyNames(
              editorManager.activeFile
            )
          );
        } catch (err) {
          console.error(err);
        }
      }

      try {
        const file =
          editorManager.getFile();

        console.log(
          "getFile():",
          file
        );

        if (file) {
          console.log(
            "getFile props:",
            Object.getOwnPropertyNames(
              file
            )
          );
        }
      } catch (err) {
        console.error(
          "getFile failed:",
          err
        );
      }

      try {
        console.log(
          "editor:",
          editorManager.editor
        );

        console.log(
          "editor props:",
          Object.getOwnPropertyNames(
            editorManager.editor
          )
        );
      } catch (err) {
        console.error(err);
      }
    }

    console.log(
      "===== WORKSPACE DEBUG END ====="
    );
  } catch (err) {
    console.error(err);
  }
}

  }