export default class LiveContextService {
  static EDIT_WORDS = [
    "patch",
    "modify",
    "replace",
    "change",
    "add",
    "remove",
    "update",
    "edit",
    "insert"
  ];

  static shouldInject(
    text
  ) {
    if (!text) {
      return false;
    }

    const lower =
      text.toLowerCase();

    return this.EDIT_WORDS.some(
      word =>
        lower.includes(word)
    );
  }

  static getContext() {
    try {
      if (
        !editorManager ||
        !editorManager.activeFile
      ) {
        return "";
      }

      const file =
        editorManager.activeFile;

      if (!file.session) {
        return "";
      }

      const content =
        file.session.getValue();

      if (!content) {
        return "";
      }

      return `
LIVE EDITOR FILE

File:
${file.name || file.filename}

IMPORTANT:
This is the latest editor buffer.
Use this exact code for patch_file.

${content}
`;
    } catch (error) {
      console.error(
        "LiveContextService error:",
        error
      );

      return "";
    }
  }
}