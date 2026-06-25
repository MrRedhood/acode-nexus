const STORAGE_KEY = "acode_nexus_sessions";

export default class SessionService {
  static createDefaultData() {
    const session = {
      id: "session_1",
      title: "New Chat",
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };

    return {
      currentSessionId: session.id,
      sessions: [session]
    };
  }

  static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        const data = this.createDefaultData();
        this.save(data);
        return data;
      }

      const data = JSON.parse(raw);

      if (!data.sessions?.length) {
        const fallback = this.createDefaultData();
        this.save(fallback);
        return fallback;
      }

      return data;
    } catch (error) {
      console.error(error);
      return this.createDefaultData();
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

  static getActiveSessionId() {
    return this.load().currentSessionId;
  }

  static getCurrentSession() {
    const data = this.load();

    return data.sessions.find(
      session => session.id === data.currentSessionId
    );
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
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
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

    if (!session) return null;

    const message = {
      id: "msg_" + Date.now(),
      role,
      content,
      createdAt: Date.now(),
      status: "done"
    };

    session.messages.push(message);
    session.updatedAt = Date.now();

    if (
      session.title === "New Chat" &&
      role === "user"
    ) {
      session.title = content.slice(0, 30);
    }

    this.save(data);

    return message;
  }

  static getMessages() {
    const session = this.getCurrentSession();
    return session ? session.messages : [];
  }
}