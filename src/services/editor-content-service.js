import EditorFileService from "./editor-file-service.js";

export default class EditorContentService {
  static getContent(
    file
  ) {
    if (!file) {
      return "";
    }

    if (
      EditorFileService.isActive(
        file
      ) &&
      editorManager?.editor?.state?.doc
    ) {
      return editorManager.editor.state.doc.toString();
    }

    return (
      file.session?.getValue?.() ||
      ""
    );
  }

  static setContent(
    file,
    content
  ) {
    if (!file) {
      return;
    }

    if (
      EditorFileService.isActive(
        file
      ) &&
      editorManager?.editor?.dispatch &&
      editorManager?.editor?.state?.doc
    ) {
      editorManager.editor.dispatch(
        {
          changes: {
            from: 0,
            to:
              editorManager.editor
                .state.doc.length,
            insert: content
          }
        }
      );

      return;
    }

    file.session?.setValue?.(
      content
    );
  }

  static replace(
    file,
    search,
    replacement
  ) {
    const current =
      this.getContent(file);

    if (
      !current.includes(search)
    ) {
      return {
        success: false,
        error:
          "Search text not found"
      };
    }

    const occurrences =
      current.split(search)
        .length - 1;

    if (occurrences > 1) {
      return {
        success: false,
        error:
          "Search text appears multiple times"
      };
    }

    const updated =
      current.replace(
        search,
        replacement
      );

    this.setContent(
      file,
      updated
    );

    return {
      success: true,
      content: updated
    };
  }

  static replaceExact(
    file,
    original,
    replacement
  ) {
    const current =
      this.getContent(file);

    if (
      !current.includes(
        original
      )
    ) {
      return {
        success: false,
        error:
          "Target content not found"
      };
    }

    const updated =
      current.replace(
        original,
        replacement
      );

    this.setContent(
      file,
      updated
    );

    return {
      success: true,
      content: updated
    };
  }
}