import SessionService from "../services/session-service.js";

export default class SessionsView {
  constructor(container, onSelect) {
    this.container = container;
    this.onSelect = onSelect;
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
                  ${session.title || "New Chat"}
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

    this.container
      .querySelectorAll(".nexus-session-item")
      .forEach(item => {
        item.addEventListener("click", () => {
          const id = item.dataset.id;

          SessionService.setActiveSession(id);

          this.container.classList.remove("open");

          this.render();
          this.onSelect?.();
        });
      });
  }
}