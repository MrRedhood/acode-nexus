import SessionService from "../services/session-service.js";

export default class SessionsView {
  constructor(container, onSelect) {
    this.container = container;
    this.onSelect = onSelect;
    this.longPressTimer = null;
    this.longPressTriggered = false;
  }

  render() {
    const sessions = SessionService.getSessions();
    const activeId = SessionService.getActiveSessionId();

    this.container.innerHTML = `
      <div class="nexus-drawer-inner">
        <button id="new-chat-btn" class="nexus-button">
          + New Chat
        </button>

        <div class="nexus-session-list">
          ${
            sessions.length
              ? sessions.map(session => `
                <button
                  class="nexus-session-item ${
                    session.id === activeId ? "active" : ""
                  }"
                  data-id="${session.id}"
                >
                  ${this.escapeHtml(session.title || "New Chat")}
                </button>
              `).join("")
              : `<div class="nexus-empty">No sessions</div>`
          }
        </div>
      </div>
    `;

    const newBtn =
      this.container.querySelector("#new-chat-btn");

    newBtn?.addEventListener("click", () => {
      SessionService.createSession();
      this.render();
      this.onSelect?.();
    });

    this.attachSessionEvents();
  }

  attachSessionEvents() {
    this.container
      .querySelectorAll(".nexus-session-item")
      .forEach(item => {
        const sessionId = item.dataset.id;

        const startPress = () => {
          this.longPressTriggered = false;

          this.longPressTimer = setTimeout(() => {
            this.longPressTriggered = true;
            this.openActionSheet(sessionId);
          }, 600);
        };

        const cancelPress = () => {
          if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
          }
        };

        item.addEventListener("touchstart", startPress);
        item.addEventListener("touchend", cancelPress);
        item.addEventListener("touchmove", cancelPress);

        item.addEventListener("mousedown", startPress);
        item.addEventListener("mouseup", cancelPress);
        item.addEventListener("mouseleave", cancelPress);

        item.addEventListener("click", () => {
          if (this.longPressTriggered) {
            this.longPressTriggered = false;
            return;
          }

          SessionService.setActiveSession(sessionId);

          this.container.classList.remove("open");

          this.render();
          this.onSelect?.();
        });
      });
  }

  openActionSheet(sessionId) {
    const overlay = document.createElement("div");
    overlay.className = "nexus-action-overlay";

    overlay.innerHTML = `
      <div class="nexus-action-sheet">
        <button data-action="rename">Rename</button>
        <button data-action="duplicate">Duplicate</button>
        <button data-action="export">Export</button>
        <button data-action="delete">Delete</button>
        <button data-action="cancel">Cancel</button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", e => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    overlay.querySelectorAll("button")
      .forEach(btn => {
        btn.addEventListener("click", () => {
          const action = btn.dataset.action;
          overlay.remove();

          if (action === "rename") {
            this.renameSession(sessionId);
          } else if (action === "duplicate") {
            SessionService.duplicateSession(sessionId);
            this.render();
            this.onSelect?.();
          } else if (action === "export") {
            this.exportSession(sessionId);
          } else if (action === "delete") {
            this.deleteSession(sessionId);
          }
        });
      });
  }

  renameSession(sessionId) {
    const sessions = SessionService.getSessions();
    const session = sessions.find(s => s.id === sessionId);

    if (!session) return;

    const title = prompt(
      "Rename session:",
      session.title
    );

    if (title === null) return;

    SessionService.renameSession(
      sessionId,
      title
    );

    this.render();
    this.onSelect?.();
  }

  exportSession(sessionId) {
    const exported =
      SessionService.exportSession(
        sessionId,
        "txt"
      );

    if (!exported) return;

    navigator.clipboard
      .writeText(exported)
      .then(() => {
        alert("Session copied to clipboard.");
      })
      .catch(() => {
        alert("Export failed.");
      });
  }

  deleteSession(sessionId) {
    const ok = confirm(
      "Delete this session?\n\nThis cannot be undone."
    );

    if (!ok) return;

    SessionService.deleteSession(sessionId);

    this.render();
    this.onSelect?.();
  }

  escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}