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

      let fileList = null;

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

      console.log(
        "fileList:",
        fileList
      );

      const result =
        fileList();

      console.log(
        "file count:",
        result.length
      );

      if (
        Array.isArray(result) &&
        result.length > 0
      ) {
        const sample =
          result[0];

        console.log(
          "sample file:",
          sample
        );

        console.log(
          "own keys:",
          Object.getOwnPropertyNames(
            sample
          )
        );

        const proto =
          Object.getPrototypeOf(
            sample
          );

        console.log(
          "prototype:",
          proto
        );

        console.log(
          "prototype keys:",
          Object.getOwnPropertyNames(
            proto
          )
        );

        for (const key of Object.getOwnPropertyNames(
          proto
        )) {
          try {
            console.log(
              "proto prop:",
              key,
              sample[key]
            );
          } catch (err) {
            console.log(
              "proto prop error:",
              key
            );
          }
        }

        this.workspaceFiles =
          result.map(
            (
              file,
              index
            ) => ({
              name:
                "file_" +
                index,
              raw: file
            })
          );
      }

      console.log(
        "Workspace files:",
        this.workspaceFiles.length
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