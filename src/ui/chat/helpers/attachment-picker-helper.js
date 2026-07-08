export default class AttachmentPickerHelper {
  static open(
    chat,
    type
  ) {
    const input =
      document.createElement(
        "input"
      );

    input.type = "file";
    input.accept = "*/*";

    input.addEventListener(
      "change",
      async event => {
        const files =
          event.target?.files;

        const file =
          files?.[0];

        if (!file) {
          return;
        }

        if (
          type === "code"
        ) {
          const allowed = [
            ".js",
            ".ts",
            ".jsx",
            ".tsx",
            ".py",
            ".java",
            ".cpp",
            ".c",
            ".cs",
            ".html",
            ".css",
            ".json",
            ".xml",
            ".md",
            ".txt"
          ];

          const lower =
            file.name.toLowerCase();

          const valid =
            allowed.some(
              ext =>
                lower.endsWith(
                  ext
                )
            );

          if (!valid) {
            chat.showToast(
              "Unsupported file"
            );
            return;
          }
        }

        await this.handleFile(
          chat,
          file,
          type
        );
      }
    );

    input.click();
  }

  static fileToText(
    file
  ) {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        const reader =
          new FileReader();

        reader.onload =
          () =>
            resolve(
              String(
                reader.result ||
                  ""
              )
            );

        reader.onerror =
          () =>
            reject(
              reader.error ||
                new Error(
                  "Text read failed"
                )
            );

        reader.readAsText(
          file,
          "UTF-8"
        );
      }
    );
  }

  static async handleFile(
    chat,
    file,
    type
  ) {
    try {
      const attachment = {
        id:
          "att_" +
          Date.now() +
          "_" +
          Math.random()
            .toString(36)
            .slice(2),

        name:
          file.name,

        size:
          file.size,

        type,

        mimeType:
          "text/plain",

        content:
          await this.fileToText(
            file
          )
      };

      if (
        !chat.pendingAttachments
      ) {
        chat.pendingAttachments =
          [];
      }

      chat.pendingAttachments.push(
        attachment
      );

      await chat.renderAttachmentPreview();

      chat.showToast(
        `${file.name} attached`
      );
    } catch (error) {
      console.error(
        "Attachment error:",
        error
      );

      chat.showToast(
        "Attachment failed"
      );
    }
  }
}