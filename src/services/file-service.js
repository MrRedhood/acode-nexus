import SearchService from "./search-service.js";

export default class FileService {
  static findOpenEditorFile(
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
            uri.split("/").pop();

          return (
            name === target ||
            name === targetBase ||
            uri === target ||
            uri.includes(target) ||
            uriBase === targetBase
          );
        }
      ) || null
    );
  }

  static async openFile(
    filename
  ) {
    try {
      const alreadyOpen =
        this.findOpenEditorFile(
          filename
        );

      if (alreadyOpen) {
        editorManager.switchFile(
          alreadyOpen.id
        );

        return {
          success: true,
          reused: true,
          file: alreadyOpen
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

      if (!content) {
        return {
          success: false,
          error:
            "Could not read file"
        };
      }

      const EditorFile =
        editorManager.files[0]
          .constructor;

      const openedFile =
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
        file: openedFile
      };
    } catch (error) {
      console.error(
        "openFile failed:",
        error
      );

      return {
        success: false,
        error: error.message
      };
    }
  }

  static async focusFile(
    filename,
    line = null
  ) {
    try {
      const file =
        this.findOpenEditorFile(
          filename
        );

      if (!file) {
        return {
          success: false,
          error:
            "File is not open in editor"
        };
      }

      editorManager.switchFile(
        file.id
      );

      if (
        line &&
        editorManager.editor
          ?.gotoLine
      ) {
        setTimeout(() => {
          try {
            editorManager.editor.gotoLine(
              line
            );
          } catch (error) {
            console.error(
              error
            );
          }
        }, 150);
      }

      return {
        success: true
      };
    } catch (error) {
      console.error(
        "focusFile failed:",
        error
      );

      return {
        success: false,
        error: error.message
      };
    }
  }
}