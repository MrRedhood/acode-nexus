import SearchService from "./search-service.js";

export default class PatchService {
  static snapshots = new Map();
  static MAX_HISTORY = 20;

  static findOpenEditorFile(filename) {
    if (!filename || !editorManager?.files) return null;

    const normalize = (val) => String(val || "").trim().replace(/\\/g, "/").toLowerCase();
    const target = normalize(filename);
    const targetBase = target.split("/").pop();

    return editorManager.files.find((file) => {
      const name = normalize(file.filename || file.name);
      const uri = normalize(file.uri);
      const uriBase = uri.split("/").pop();
      return name === target || name === targetBase || uri === target || uri.includes(target) || uriBase === targetBase;
    }) || null;
  }

  static async openFile(filename) {
    try {
      const alreadyOpen = this.findOpenEditorFile(filename);
      if (alreadyOpen) {
        editorManager.switchFile(alreadyOpen.id);
        return { success: true, reused: true, file: alreadyOpen };
      }

      const file = SearchService.openFile(filename);
      if (!file) return { success: false, error: "File not found" };

      const content = await SearchService.readFullFile(filename);
      if (content === null) return { success: false, error: "Could not read file" };

      const EditorFile = editorManager.files[0].constructor;
      const openedFile = new EditorFile(file.name, { uri: file.url || file.path, text: content, editable: true });

      return { success: true, file: openedFile };
    } catch (error) {
      console.error("openFile failed:", error);
      return { success: false, error: error.message };
    }
  }

  static isActiveFile(file) {
    return editorManager?.activeFile?.id === file?.id;
  }

  static getFileContent(file) {
    if (!file) return "";
    if (this.isActiveFile(file) && editorManager?.editor?.state?.doc) {
      return editorManager.editor.state.doc.toString();
    }
    return file.session?.getValue?.() || "";
  }

  static setFileContent(file, content) {
    if (!file) return;
    if (this.isActiveFile(file) && editorManager?.editor?.dispatch) {
      editorManager.editor.dispatch({
        changes: { from: 0, to: editorManager.editor.state.doc.length, insert: content }
      });
      return;
    }
    file.session?.setValue?.(content);
  }

  static saveSnapshot(file) {
    if (!file) return;
    const key = file.filename || file.name || file.uri;
    const content = this.getFileContent(file);
    const history = this.snapshots.get(key) || [];

    if (history.length > 0 && history[history.length - 1] === content) return;

    history.push(content);
    if (history.length > this.MAX_HISTORY) history.shift();
    this.snapshots.set(key, history);
  }

  static async replaceFile(action) {
    try {
      let file = this.findOpenEditorFile(action.file);
      if (!file) {
        const open = await this.openFile(action.file);
        if (!open.success) return open;
        file = open.file;
      }

      editorManager.switchFile(file.id);
      this.saveSnapshot(file);
      this.setFileContent(file, action.content);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async patchFile(action) {
    try {
      let file = this.findOpenEditorFile(action.file);
      if (!file) {
        const open = await this.openFile(action.file);
        if (!open.success) return open;
        file = open.file;
      }

      const content = this.getFileContent(file);
      if (!content.includes(action.search)) return { success: false, error: "Search text not found" };
      if (content.split(action.search).length > 2) return { success: false, error: "Search text appears multiple times" };

      editorManager.switchFile(file.id);
      this.saveSnapshot(file);
      this.setFileContent(file, content.replace(action.search, action.replace));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async undoFile(action) {
    try {
      let file = this.findOpenEditorFile(action.file);
      if (!file) return { success: false, error: "File not found" };

      const key = file.filename || file.name || file.uri;
      const history = this.snapshots.get(key);

      if (!history?.length) return { success: false, error: "No snapshot found" };

      this.setFileContent(file, history.pop());
      if (history.length === 0) this.snapshots.delete(key);
      else this.snapshots.set(key, history);

      editorManager.switchFile(file.id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}