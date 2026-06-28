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

      if (
        typeof fileList ===
        "function"
      ) {
        try {
          const result =
            fileList();

          console.log(
            "fileList result:",
            result
          );

          if (
            Array.isArray(
              result
            )
          ) {
            this.workspaceFiles =
              result.map(
                file => ({
                  name:
                    file.name ||
                    "unknown",
                  url:
                    file.url ||
                    "",
                  raw: file
                })
              );
          }
        } catch (error) {
          console.error(
            "fileList execute failed:",
            error
          );
        }
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

      console.log(
        "acode exists:",
        typeof acode
      );

      if (
        typeof acode ===
        "undefined"
      ) {
        console.log(
          "No acode"
        );
        return;
      }

      console.log(
        "acode keys:",
        Object.getOwnPropertyNames(
          acode
        )
      );

      if (acode.require) {
        console.log(
          "require exists"
        );

        const modules = [
          "fs",
          "fileList",
          "url",
          "helpers"
        ];

        for (const name of modules) {
          try {
            const mod =
              acode.require(
                name
              );

            console.log(
              `MODULE ${name}:`,
              mod
            );

            if (mod) {
              console.log(
                `${name} props:`,
                Object.getOwnPropertyNames(
                  mod
                )
              );
            }
          } catch (err) {
            console.error(
              `Failed loading ${name}:`,
              err
            );
          }
        }
      }

      await this.scanWorkspace();

      console.log(
        "===== WORKSPACE DEBUG END ====="
      );
    } catch (err) {
      console.error(err);
    }
  }
}