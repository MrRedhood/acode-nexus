import PatchService from "./patch-service.js";
import DiffPreviewModal from "../ui/diff-preview-modal.js";

export default class DiffPreviewService {
  static async previewPatch(action) {
    let file =
      PatchService.findOpenEditorFile(
        action.file
      );

    if (!file) {
      const result =
        await PatchService.openFile(
          action.file
        );

      if (!result.success) {
        return false;
      }

      file = result.file;
    }

    if (!file) {
      return false;
    }

    const original =
      editorManager.activeFile?.id ===
        file.id &&
      editorManager.editor?.state
        ?.doc
      ? editorManager.editor.state.doc.toString()
      : file.session.getValue();

    if (
      !original.includes(
        action.search
      )
    ) {
      throw new Error(
        "Search text not found."
      );
    }

    const occurrences =
      original.split(
        action.search
      ).length - 1;

    if (occurrences > 1) {
      throw new Error(
        "Search text appears multiple times."
      );
    }

    const modified =
      original.replace(
        action.search,
        action.replace
      );

    return await DiffPreviewModal.show({
      file:
        action.file,
      original,
      modified
    });
  }

  static async previewReplace(
    action
  ) {
    let file =
      PatchService.findOpenEditorFile(
        action.file
      );

    if (!file) {
      const result =
        await PatchService.openFile(
          action.file
        );

      if (!result.success) {
        return false;
      }

      file = result.file;
    }

    if (!file) {
      return false;
    }

    const original =
      editorManager.activeFile?.id ===
        file.id &&
      editorManager.editor?.state
        ?.doc
      ? editorManager.editor.state.doc.toString()
      : file.session.getValue();

    return await DiffPreviewModal.show({
      file:
        action.file,
      original,
      modified:
        action.content
    });
  }
}