import SessionService from "../services/session-service.js";

export default class SessionsView {
  constructor(container, onSessionChange) {
    this.container = container;
    this.onSessionChange = onSessionChange;
  }

  render() {
    const sessions = SessionService.getSessions();
    const current = SessionService.getCurrentSession();

    this.container.innerHTML = `
      <div class="nexus-sessions-header">
        <button id="new-session-btn" class="nexus-button">
          + New Chat
        </button>
      </div>

      <div id="sessions-list"></div>
    `;

    const list = this.container.querySelector("#sessions-list");

    sessions.forEach(session => {
      const item = document.createElement("div");
      item.className = "nexus-session-item";

      if (current && current.id === session.id) {
        item.classList.add("active");
      }

      item.textContent = session.title;

      item.addEventListener("click", () => {
        SessionService.switchSession(session.id);

        if (this.onSessionChange) {
          this.onSessionChange();
        }
      });

      list.appendChild(item);
    });

    this.container
      .querySelector("#new-session-btn")
      .addEventListener("click", () => {
        SessionService.createSession();

        if (this.onSessionChange) {
          this.onSessionChange();
        }
      });
  }
}