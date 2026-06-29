export default class WorkspaceManager {
  static workspaceFiles = [];

  static async scanWorkspace() {
    try {
      this.workspaceFiles = [];

      if (
        typeof acode === "undefined"
      ) {
        return [];
      }

      if (!acode.require) {
        return [];
      }

      let fileList;

      try {
        fileList =
          acode.require(
            "fileList"
          );
      } catch {
        return [];
      }

      if (
        typeof fileList !==
        "function"
      ) {
        return [];
      }

      const result =
        fileList();

      if (
        !Array.isArray(
          result
        )
      ) {
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

      return this.workspaceFiles;
    } catch (error) {
      console.error(error);
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
        "===== OPEN DEBUG START ====="
      );

      if (
        typeof editorManager !==
        "undefined"
      ) {
        console.log(
          "editorManager props:",
          Object.getOwnPropertyNames(
            editorManager
          )
        );

        console.log(
          "addFile:",
          editorManager.addFile
        );

        console.log(
          "switchFile:",
          editorManager.switchFile
        );

        if (
          editorManager.addFile
        ) {
          console.log(
            "addFile length:",
            editorManager.addFile
              .length
          );
        }

        if (
          editorManager.switchFile
        ) {
          console.log(
            "switchFile length:",
            editorManager.switchFile
              .length
          );
        }
      }

      console.log(
        "===== OPEN DEBUG END ====="
      );
    } catch (err) {
      console.error(err);
    }
  }
}