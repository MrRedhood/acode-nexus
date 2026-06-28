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

      try {
        const sample =
          result[0];

        console.log(
          "toJSON:",
          sample.toJSON()
        );
      } catch (e) {
        console.error(
          "toJSON failed:",
          e
        );
      }

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
          let name =
            "unknown";
          let url = "";
          let path = "";

          try {
            name =
              file.name ||
              "unknown";
          } catch {}

          try {
            url =
              file.url || "";
          } catch {}

          try {
            path =
              file.path || "";
          } catch {}

          return {
            name,
            url,
            path,
            raw: file
          };
        });

      console.log(
        "Workspace files:",
        this.workspaceFiles.length
      );

      console.log(
        "Sample parsed file:",
        this.workspaceFiles[0]
      );

      console.log(
        "===== WORKSPACE SCAN END ====="
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
        file.name
          .toLowerCase()
          .includes(lower) ||
        file.path
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
        "===== WORKSPACE DEBUG END ====="
      );
    } catch (err) {
      console.error(err);
    }
  }
}