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

      try {
        console.log(
          "filename:",
          file.filename
        );
      } catch (e) {
        console.log(
          "filename read failed",
          e
        );
      }

      try {
        console.log(
          "name:",
          file.name
        );
      } catch (e) {
        console.log(
          "name read failed",
          e
        );
      }

      try {
        console.log(
          "uri:",
          file.uri
        );
      } catch (e) {
        console.log(
          "uri read failed",
          e
        );
      }

      try {
        console.log(
          "location:",
          file.location
        );
      } catch (e) {
        console.log(
          "location read failed",
          e
        );
      }

      try {
        console.log(
          "id:",
          file.id
        );
      } catch (e) {
        console.log(
          "id read failed",
          e
        );
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