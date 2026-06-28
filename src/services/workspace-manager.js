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
            "file count:",
            Array.isArray(
              result
            )
              ? result.length
              : "not array"
          );

          if (
            Array.isArray(
              result
            ) &&
            result.length > 0
          ) {
            const sample =
              result[0];

            console.log(
              "sample file:",
              sample
            );

            console.log(
              "sample keys:",
              Object.getOwnPropertyNames(
                sample
              )
            );

            for (const key in sample) {
              console.log(
                "sample prop:",
                key,
                sample[key]
              );
            }

            this.workspaceFiles =
              result.map(
                (
                  file,
                  index
                ) => {
                  let name =
                    "unknown";
                  let url = "";

                  try {
                    if (
                      file &&
                      typeof file ===
                        "object"
                    ) {
                      name =
                        file.name ||
                        file.filename ||
                        file.title ||
                        `file_${index}`;

                      url =
                        file.url ||
                        file.uri ||
                        file.path ||
                        "";
                    }
                  } catch (err) {
                    console.error(
                      "file parse error:",
                      err
                    );
                  }

                  return {
                    name,
                    url,
                    raw: file
                  };
                }
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