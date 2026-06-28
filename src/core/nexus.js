import Sidebar from "../ui/sidebar.js";
import SessionService from "../services/session-service.js";
import AttachmentStorage from "../services/attachment-storage.js";

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
    console.log(
      "[Nexus] Attachment migration start"
    );

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

      if (!ids.length) {
        continue;
      }

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

      console.log(
        `[Nexus] Migrated ${migrated} attachments`
      );
    } else {
      console.log(
        "[Nexus] No attachment migration needed"
      );
    }

    return migrated;
  }

  async getCurrentFile() {
    try {
      console.log(
        "[NEXUS] getCurrentFile entered"
      );

      console.log(
        "window.editorManager:",
        window.editorManager
      );

      if (
        typeof editorManager ===
        "undefined"
      ) {
        console.error(
          "editorManager not found"
        );
        return null;
      }

      const editor =
        editorManager?.editor;

      if (!editor) {
        console.error(
          "editor missing"
        );
        return null;
      }

      const session =
        editor.session;

      if (!session) {
        console.error(
          "session missing"
        );
        return null;
      }

      const content =
        session.getValue();

      const filename =
        editorManager
          ?.activeFile?.name ||
        "current-file.txt";

      return {
        name: filename,
        content
      };
    } catch (error) {
      console.error(
        "Current file read failed:",
        error
      );

      return null;
    }
  }

  debugWorkspace() {
    try {
      console.log(
        "[NEXUS] Workspace debug start"
      );

      const fs =
        acode.require("fs");

      const fileList =
        acode.require(
          "fileList"
        );

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
        "fs full:",
        fs
      );

      console.log(
        "fileList type:",
        typeof fileList
      );

      console.log(
        "fileList keys:",
        Object.keys(
          fileList || {}
        )
      );

      console.log(
        "fileList full:",
        fileList
      );

      return true;
    } catch (error) {
      console.error(
        "[NEXUS] Workspace debug failed:",
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

      console.log("ACODE FULL:", acode);

console.log(
  "ACODE KEYS:",
  Object.getOwnPropertyNames(acode)
);

console.log(
  "WINDOW KEYS SAMPLE:",
  Object.getOwnPropertyNames(window)
    .filter(
      key =>
        key.toLowerCase().includes("file") ||
        key.toLowerCase().includes("acode") ||
        key.toLowerCase().includes("fs")
    )
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
          "fs full:",
          fs
        );
      } catch (e) {
        console.error(
          "fs fail",
          e
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
          "fileList keys:",
          Object.keys(
            fileList || {}
          )
        );

        console.log(
          "fileList full:",
          fileList
        );
      } catch (e) {
        console.error(
          "fileList fail",
          e
        );
      }

      await this.injectStyles();
      await this.migrateAttachments();

      window.NexusBridge = {
        getCurrentFile:
          async () => {
            console.log(
              "[NEXUS BRIDGE] getCurrentFile called"
            );

            return await this.getCurrentFile();
          },

        debugWorkspace:
          () => {
            return this.debugWorkspace();
          }
      };

      console.log(
        "Creating sidebar"
      );

      this.sidebar =
        new Sidebar(
          this.page
        );

      this.sidebar.init();

      console.log(
        "Sidebar initialized"
      );
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