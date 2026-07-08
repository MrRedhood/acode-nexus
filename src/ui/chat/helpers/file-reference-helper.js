import SearchService from "../../../services/search-service.js";

export default class FileReferenceHelper {
  static convert(content) {
    if (!content) {
      return "";
    }

    return content.replace(
      /([A-Za-z0-9_./-]+\.(js|json|css|md)):(\d+)/g,
      (match, file, ext, line) => {
        return `
<span
  class="nexus-file-ref"
  data-file="${file}"
  data-line="${line}"
  style="
    color:#7ab7ff;
    text-decoration:underline;
    cursor:pointer;
  "
>
  ${match}
</span>
`;
      }
    );
  }

  static attach(
    chat,
    msgNode
  ) {
    const refs =
      msgNode.querySelectorAll(
        ".nexus-file-ref"
      );

    refs.forEach(ref => {
      ref.addEventListener(
        "click",
        () => {
          const filepath =
            ref.dataset.file;

          const line =
            parseInt(
              ref.dataset.line,
              10
            );

          const file =
            SearchService.openFile(
              filepath
            );

          if (!file) {
            chat.showToast(
              "File not found"
            );
            return;
          }

          if (
            typeof editorManager ===
              "undefined" ||
            !editorManager ||
            !editorManager.switchFile
          ) {
            chat.showToast(
              "editorManager missing"
            );
            return;
          }

          const openedFile =
            editorManager.files.find(
              f =>
                f.filename ===
                  file.name ||
                filepath.endsWith(
                  f.filename
                ) ||
                (
                  file.path &&
                  file.path.endsWith(
                    f.filename
                  )
                )
            );

          if (!openedFile) {
            chat.showToast(
              "Open file in editor first"
            );
            return;
          }

          editorManager.switchFile(
            openedFile.id
          );

          let attempts = 0;

          const maxAttempts =
            40;

          const waitForFile =
            setInterval(() => {
              attempts++;

              const active =
                editorManager.activeFile;

              if (
                active &&
                active.filename ===
                  openedFile.filename
              ) {
                clearInterval(
                  waitForFile
                );

                setTimeout(() => {
                  if (
                    editorManager.editor &&
                    editorManager.editor.gotoLine
                  ) {
                    editorManager.editor.gotoLine(
                      line
                    );
                  }
                }, 100);
              }

              if (
                attempts >=
                maxAttempts
              ) {
                clearInterval(
                  waitForFile
                );

                chat.showToast(
                  "File switch timeout"
                );
              }
            }, 100);
        }
      );
    });
  }
}