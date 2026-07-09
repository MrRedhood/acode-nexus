import EditorContentService from "./editor-content-service.js";

export default class SnapshotService {
  static snapshots =
    new Map();

  static MAX_HISTORY =
    20;

  static save(file) {
    if (!file) {
      return;
    }

    const key =
      file.filename ||
      file.name ||
      file.uri;

    const content =
      EditorContentService.getContent(
        file
      );

    let history =
      this.snapshots.get(
        key
      ) || [];

    if (
      history.length &&
      history[
        history.length - 1
      ] === content
    ) {
      return;
    }

    history.push(
      content
    );

    if (
      history.length >
      this.MAX_HISTORY
    ) {
      history.shift();
    }

    this.snapshots.set(
      key,
      history
    );
  }

  static undo(file) {
    if (!file) {
      return {
        success: false,
        error:
          "No file."
      };
    }

    const key =
      file.filename ||
      file.name ||
      file.uri;

    const history =
      this.snapshots.get(
        key
      );

    if (
      !history ||
      !history.length
    ) {
      return {
        success: false,
        error:
          "No snapshot found"
      };
    }

    const snapshot =
      history.pop();

    EditorContentService.setContent(
      file,
      snapshot
    );

    if (
      history.length ===
      0
    ) {
      this.snapshots.delete(
        key
      );
    } else {
      this.snapshots.set(
        key,
        history
      );
    }

    return {
      success: true
    };
  }

  static clear(file) {
    if (!file) {
      return;
    }

    const key =
      file.filename ||
      file.name ||
      file.uri;

    this.snapshots.delete(
      key
    );
  }

  static clearAll() {
    this.snapshots.clear();
  }

  static getHistory(
    file
  ) {
    if (!file) {
      return [];
    }

    const key =
      file.filename ||
      file.name ||
      file.uri;

    return (
      this.snapshots.get(
        key
      ) || []
    );
  }
}