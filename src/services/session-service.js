const STORAGE_KEY = "acode_nexus_sessions";

export default class SessionService {
  static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        const defaultData = {
          currentSessionId: "session_1",
          sessions: [
            {
              id: "session_1",
              title: "New Chat",
              messages: []
            }
          ]
        };

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(defaultData)
        );

        return defaultData;
      }

      return JSON.parse(raw);
    } catch (error) {
      console.error(error);

      return {
        currentSessionId: null,
        sessions: []
      };
    }
  }

  static save(data) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );
  }

  static getSessions() {
    return this.load().sessions;
  }

  static getCurrentSession() {
    const data = this.load();

    return data.sessions.find(
      session => session.id === data.currentSessionId
    );
  }

  static getActiveSessionId() {
    return this.load().currentSessionId;
  }

  static setActiveSession(id) {
    const data = this.load();
    data.currentSessionId = id;
    this.save(data);
  }

  static switchSession(id) {
    this.setActiveSession(id);
  }

  static createSession() {
    const data = this.load();

    const newSession = {
      id: "session_" + Date.now(),
      title: "New Chat",
      messages: []
    };

    data.sessions.unshift(newSession);
    data.currentSessionId = newSession.id;

    this.save(data);

    return newSession;
  }

  static addMessage(role, content) {
    const data = this.load();

    const session = data.sessions.find(
      session => session.id === data.currentSessionId
    );

    if (!session) return;

    session.messages.push({
      role,
      content
    });

    if (
      session.title === "New Chat" &&
      role === "user"
    ) {
      session.title = content.slice(0, 30);
    }

    this.save(data);
  }

  static getMessages() {
    const session = this.getCurrentSession();
    return session ? session.messages : [];
  }
}