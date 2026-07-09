import SearchService from "./search-service.js";

export default class EditorFileService {
  static findOpenFile(
    filename
  ) {
    if (
      !filename ||
      !editorManager ||
      !editorManager.files
    ) {
      return null;
    }

    const normalize = value =>
      String(value || "")
        .trim()
        .replace(/\\/g, "/")
        .toLowerCase();

    const target =
      normalize(filename);

    const targetBase =
      target.split("/").pop();

    return (
      editorManager.files.find(
        file => {
          const name =
            normalize(
              file.filename ||
                file.name
            );

          const uri =
            normalize(file.uri);

          const uriBase =
            uri
              .split("/")
              .pop();

          return (
            name ===
              target ||
            name ===
              targetBase ||
            uri ===
              target ||
            uri.includes(
              target
            ) ||
            uriBase ===
              targetBase
          );
        }
      ) || null
    );
  }

  static async openFile(
    filename
  ) {
    try {
      const existing =
        this.findOpenFile(
          filename
        );

      if (existing) {
        editorManager.switchFile(
          existing.id
        );

        return {
          success: true,
          reused: true,
          file: existing
        };
      }

      const file =
        SearchService.openFile(
          filename
        );

      if (!file) {
        return {
          success: false,
          error:
            "File not found"
        };
      }

      const content =
        await SearchService.readFullFile(
          filename
        );

      if (
        content == null
      ) {
        return {
          success: false,
          error:
            "Could not read file"
        };
      }

      const EditorFile =
        editorManager.files[0]
          .constructor;

      const opened =
        new EditorFile(
          file.name,
          {
            uri:
              file.url ||
              file.path,
            text: content,
            editable: true
          }
        );

      return {
        success: true,
        file: opened
      };
    } catch (error) {
      console.error(
        "openFile failed:",
        error
      );

      return {
        success: false,
        error:
          error.message
      };
    }
  }

  static switchTo(
    file
  ) {
    if (
      file?.id
    ) {
      editorManager.switchFile(
        file.id
      );
    }
  }

  static isActive(
    file
  ) {
    return (
      editorManager
        ?.activeFile
        ?.id === file?.id
    );
  }
}