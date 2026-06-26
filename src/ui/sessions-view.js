import SessionService from "../services/session-service.js";

export default class SessionsView {
  constructor(container, onSelect) {
    this.container = container;
    this.onSelect = onSelect;
    this.longPressTimer = null;
    this.longPressTriggered = false;
    this.isTouchDevice = false;
  }

  render() {
    const sessions = SessionService.getSessions();
    const activeId =
      SessionService.getActiveSessionId();

    this.container.innerHTML = `
      <div class="nexus-drawer-inner">
        <button id="new-chat-btn" class="nexus-button">
          + New Chat
        </button>

        <div class="nexus-session-list">
          ${
            sessions.length
              ? sessions
                  .map(
                    session => `
                <button
                  class="nexus-session-item ${
                    session.id === activeId
                      ? "active"
                      : ""
                  }"
                  data-id="${session.id}"
                >
                  ${this.escapeHtml(
                    session.title ||
                      "New Chat"
                  )}
                </button>
              `
                  )
                  .join("")
              : `<div class="nexus-empty">No sessions</div>`
          }
        </div>
      </div>
    `;

    const newBtn =
      this.container.querySelector(
        "#new-chat-btn"
      );

    newBtn?.addEventListener(
      "click",
      () => {
        SessionService.createSession();
        this.render();
        this.onSelect?.();
      }
    );

    this.attachSessionEvents();
  }

  attachSessionEvents() {
    this.container
      .querySelectorAll(
        ".nexus-session-item"
      )
      .forEach(item => {
        const sessionId =
          item.dataset.id;

        const startPress = e => {
          if (
            e.type === "touchstart"
          ) {
            this.isTouchDevice = true;
          }

          if (
            this.isTouchDevice &&
            e.type === "mousedown"
          ) {
            return;
          }

          this.longPressTriggered = false;

          this.longPressTimer =
            setTimeout(() => {
              this.longPressTriggered = true;
              this.openActionSheet(
                sessionId
              );
            }, 600);
        };

        const cancelPress = () => {
          if (
            this.longPressTimer
          ) {
            clearTimeout(
              this.longPressTimer
            );
            this.longPressTimer =
              null;
          }
        };

        item.addEventListener(
          "touchstart",
          startPress
        );
        item.addEventListener(
          "touchend",
          cancelPress
        );
        item.addEventListener(
          "touchmove",
          cancelPress
        );

        item.addEventListener(
          "mousedown",
          startPress
        );
        item.addEventListener(
          "mouseup",
          cancelPress
        );
        item.addEventListener(
          "mouseleave",
          cancelPress
        );

        item.addEventListener(
          "click",
          () => {
            if (
              this.longPressTriggered
            ) {
              this.longPressTriggered =
                false;
              return;
            }

            SessionService.setActiveSession(
              sessionId
            );

            this.container.classList.remove(
              "open"
            );

            this.render();
            this.onSelect?.();
          }
        );
      });
  }

  openActionSheet(sessionId) {
    const overlay =
      document.createElement("div");

    overlay.className =
      "nexus-action-overlay";

    overlay.innerHTML = `
      <div class="nexus-action-sheet">
        <button data-action="rename">Rename</button>
        <button data-action="duplicate">Duplicate</button>
        <button data-action="export">Export</button>
        <button data-action="delete">Delete</button>
        <button data-action="cancel">Cancel</button>
      </div>
    `;

    document.body.appendChild(
      overlay
    );

    overlay.addEventListener(
      "click",
      e => {
        if (e.target === overlay) {
          overlay.remove();
        }
      }
    );

    overlay
      .querySelectorAll("button")
      .forEach(btn => {
        btn.addEventListener(
          "click",
          () => {
            const action =
              btn.dataset.action;

            overlay.remove();

            if (
              action === "rename"
            ) {
              this.openRenameModal(
                sessionId
              );
            } else if (
              action === "duplicate"
            ) {
              SessionService.duplicateSession(
                sessionId
              );
              this.render();
              this.onSelect?.();
            } else if (
              action === "export"
            ) {
              this.exportSession(
                sessionId
              );
            } else if (
              action === "delete"
            ) {
              this.openDeleteModal(
                sessionId
              );
            }
          }
        );
      });
  }

  showToast(text) {
    const old =
      document.querySelector(
        ".nexus-copy-toast"
      );

    if (old) old.remove();

    const toast =
      document.createElement("div");

    toast.className =
      "nexus-copy-toast";
    toast.textContent = text;

    document.body.appendChild(
      toast
    );

    setTimeout(
      () => toast.remove(),
      1500
    );
  }

  openRenameModal(sessionId) {
    const sessions =
      SessionService.getSessions();

    const session =
      sessions.find(
        s => s.id === sessionId
      );

    if (!session) return;

    const overlay =
      document.createElement("div");

    overlay.className =
      "nexus-action-overlay";

    overlay.innerHTML = `
      <div class="nexus-action-sheet">
        <input
          id="rename-input"
          class="nexus-input"
          value="${this.escapeHtml(
            session.title
          )}"
          placeholder="Session name"
        />

        <button id="rename-save">
          Save
        </button>

        <button id="rename-cancel">
          Cancel
        </button>
      </div>
    `;

    document.body.appendChild(
      overlay
    );

    const input =
      overlay.querySelector(
        "#rename-input"
      );

    input?.focus();

        overlay
      .querySelector("#rename-save")
      ?.addEventListener(
        "click",
        () => {
          const newTitle =
            input.value.trim();

          if (!newTitle) {
            this.showToast(
              "Title cannot be empty"
            );
            return;
          }

          SessionService.renameSession(
            sessionId,
            newTitle
          );

          overlay.remove();
          this.render();
          this.onSelect?.();
        }
      );

    overlay
      .querySelector(
        "#rename-cancel"
      )
      ?.addEventListener(
        "click",
        () => {
          overlay.remove();
        }
      );
  }

  openDeleteModal(sessionId) {
    const overlay =
      document.createElement("div");

    overlay.className =
      "nexus-action-overlay";

    overlay.innerHTML = `
      <div class="nexus-action-sheet">
        <div style="color:white; padding:8px 4px 14px;">
          Delete this session?<br><br>
          This cannot be undone.
        </div>

        <button id="delete-confirm" data-action="delete">
          Delete
        </button>

        <button id="delete-cancel">
          Cancel
        </button>
      </div>
    `;

    document.body.appendChild(
      overlay
    );

    overlay
      .querySelector(
        "#delete-confirm"
      )
      ?.addEventListener(
        "click",
        () => {
          SessionService.deleteSession(
            sessionId
          );

          overlay.remove();
          this.render();
          this.onSelect?.();
        }
      );

    overlay
      .querySelector(
        "#delete-cancel"
      )
      ?.addEventListener(
        "click",
        () => {
          overlay.remove();
        }
      );
  }

  exportSession(sessionId) {
    const exported =
      SessionService.exportSession(
        sessionId,
        "txt"
      );

    if (!exported) {
      this.showToast(
        "Export failed"
      );
      return;
    }

    navigator.clipboard
      .writeText(exported)
      .then(() => {
        this.showToast(
          "Session copied"
        );
      })
      .catch(() => {
        this.showToast(
          "Copy failed"
        );
      });
  }

  escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}