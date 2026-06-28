import Sidebar from "../ui/sidebar.js";
import SessionService from "../services/session-service.js";
import AttachmentStorage from "../services/attachment-storage.js";
import WorkspaceManager from "../services/workspace-manager.js";

export default class Nexus {
  constructor(baseUrl, page, options) {
    this.baseUrl = baseUrl;
    this.page = page;
    this.options = options;
    this.sidebar = null;
  }

  async injectStyles() {
    console.log("Inject styles start");

    const cssPath =
      `${this.baseUrl}style.css`;

    console.log(
      "CSS path:",
      cssPath
    );

    const res =
      await fetch(cssPath);

    const css =
      await res.text();

    const style =
      document.createElement(
        "style"
      );

    style.id = "nexus-style";
    style.textContent = css;

    document.head.appendChild(
      style
    );

    console.log(
      "Inject styles done"
    );
  }

  async migrateAttachments() {
    const data =
      SessionService.load();

    let migrated = 0;

    for (const session of data.sessions) {
      const attachments =
        session.attachments || {};

      const ids =
        Object.keys(
          attachments
        );

      for (const id of ids) {
        const attachment =
          attachments[id];

        if (!attachment) {
          continue;
        }

        try {
          await AttachmentStorage.saveAttachment(
            attachment
          );

          migrated++;
        } catch (error) {
          console.error(
            "Attachment migration failed:",
            id,
            error
          );
        }
      }

      session.attachments = {};
    }

    if (migrated > 0) {
      SessionService.save(data);
    }

    return migrated;
  }

  async getCurrentFile() {
    try {
      if (
        typeof editorManager ===
        "undefined"
      ) {
        return null;
      }

      const editor =
        editorManager &&
        editorManager.editor;

      if (!editor) {
        return null;
      }

      const session =
        editor.session;

      if (!session) {
        return null;
      }

      const content =
        session.getValue();

      let filename =
        "current-file.txt";

      if (
        editorManager &&
        editorManager.activeFile &&
        editorManager.activeFile.name
      ) {
        filename =
          editorManager.activeFile.name;
      }

      return {
        name: filename,
        content
      };
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  debugWorkspace() {
    try {
      console.log(
        "===== NEXUS DEBUG START ====="
      );

      console.log(
        "window.resolveLocalFileSystemURL:",
        typeof window.resolveLocalFileSystemURL
      );

      console.log(
        "window.requestFileSystem:",
        typeof window.requestFileSystem
      );

      try {
        const fs =
          acode.require("fs");

        console.log(
          "fs type:",
          typeof fs
        );

        console.log(
          "fs keys:",
          Object.keys(
            fs || {}
          )
        );

        console.log(
          "fs own props:",
          Object.getOwnPropertyNames(
            fs
          )
        );

        for (const key in fs) {
          console.log(
            "fs method:",
            key,
            typeof fs[key]
          );
        }
      } catch (error) {
        console.error(
          "fs debug failed:",
          error
        );
      }

      try {
        const fileList =
          acode.require(
            "fileList"
          );

        console.log(
          "fileList type:",
          typeof fileList
        );

        console.log(
          "fileList value:",
          fileList
        );

        console.log(
          "fileList string:",
          String(fileList)
        );

        console.log(
          "fileList props:",
          Object.getOwnPropertyNames(
            fileList
          )
        );

        if (
          typeof fileList ===
          "function"
        ) {
          try {
            const result =
              fileList();

            console.log(
              "fileList() result:",
              result
            );

            if (
              Array.isArray(
                result
              )
            ) {
              console.log(
                "fileList length:",
                result.length
              );

              console.log(
                "first 20:",
                result.slice(
                  0,
                  20
                )
              );
            }
          } catch (error) {
            console.error(
              "fileList call failed:",
              error
            );
          }
        }
      } catch (error) {
        console.error(
          "fileList debug failed:",
          error
        );
      }

      console.log(
        "===== NEXUS DEBUG END ====="
      );

      return true;
    } catch (error) {
      console.error(
        error
      );
      return false;
    }
  }

  async init() {
    try {
      console.log(
        "Nexus init start"
      );

      await this.injectStyles();
      await this.migrateAttachments();

      window.NexusBridge = {
        getCurrentFile:
          async () => {
            return await this.getCurrentFile();
          },

        debugWorkspace:
          () => {
            return this.debugWorkspace();
          }
      };

      this.sidebar =
        new Sidebar(
          this.page
        );

      this.sidebar.init();
    } catch (err) {
      console.error(
        "Nexus init crash:",
        err
      );
    }
  }

  destroy() {
    if (this.sidebar) {
      this.sidebar.destroy();
    }

    delete window.NexusBridge;

    const style =
      document.getElementById(
        "nexus-style"
      );

    if (style) {
      style.remove();
    }
  }
}