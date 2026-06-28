export default class WorkspaceManager {
  static debug() {
    try {
      console.log(
        "===== WORKSPACE DEBUG START ====="
      );

      console.log(
        "acode exists:",
        typeof acode
      );

      if (!acode) {
        console.log("No acode");
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

      console.log(
        "===== WORKSPACE DEBUG END ====="
      );
    } catch (err) {
      console.error(err);
    }
  }
}