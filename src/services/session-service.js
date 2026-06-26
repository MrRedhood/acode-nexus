const STORAGE_KEY = "acode_nexus_sessions";

export default class SessionService {
  static createMessage(role, content) {
    return {
      id:
        "msg_" +
        Date.now() +
        "_" +
        Math.random().toString(36).slice(2),
      role,
      content,
      createdAt: Date.now()
    };
  }

  static normalizeData(data) {
    if (!data || !Array.isArray(data.sessions)) {
      return {
        currentSessionId: "session_1",
        sessions: [
          {
            id: "session_1",
            title: "New Chat",
            messages: []
          }
        ]
      };
    }

    data.sessions.forEach(session => {
      if (!Array.isArray(session.messages)) {
        session.messages = [];
      }

      session.messages = session.messages.map(msg => {
        if (!msg.id) {
          msg.id =
            "msg_" +
            Date.now() +
            "_" +
            Math.random()
              .toString(36)
              .slice(2);
        }

        if (!msg.createdAt) {
          msg.createdAt = Date.now();
        }

        if (!msg.content) {
          msg.content = "";
        }

        return msg;
      });
    });

    if (!data.currentSessionId) {
      data.currentSessionId =
        data.sessions[0]?.id || null;
    }

    return data;
  }

  static load() {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY);

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

      const parsed = JSON.parse(raw);
      const normalized =
        this.normalizeData(parsed);

      this.save(normalized);

      return normalized;
    } catch (error) {
      console.error(error);

      return {
        currentSessionId: "session_1",
        sessions: [
          {
            id: "session_1",
            title: "New Chat",
            messages: []
          }
        ]
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
      session =>
        session.id === data.currentSessionId
    );
  }

  static getMessages() {
    const session =
      this.getCurrentSession();

    return session
      ? session.messages
      : [];
  }

  static getActiveSessionId() {
    return this.load().currentSessionId;
  }

  static setActiveSession(id) {
    const data = this.load();
    data.currentSessionId = id;
    this.save(data);
  }

  static createSession() {
    const data = this.load();

    const newSession = {
      id: "session_" + Date.now(),
      title: "New Chat",
      messages: []
    };

    data.sessions.unshift(newSession);
    data.currentSessionId =
      newSession.id;

    this.save(data);

    return newSession;
  }

  static addMessage(role, content) {
    const message =
      this.createMessage(role, content);

    this.addExistingMessage(message);

    return message;
  }

  static addExistingMessage(message) {
    const data = this.load();

    const session =
      data.sessions.find(
        s =>
          s.id === data.currentSessionId
      );

    if (!session) return null;

    session.messages.push(message);

    if (
      session.title === "New Chat" &&
      message.role === "user"
    ) {
      session.title =
        message.content.slice(0, 30);
    }

    this.save(data);

    return message;
  }

  static updateMessage(messageId, newContent) {
    const data = this.load();

    const session =
      data.sessions.find(
        s =>
          s.id === data.currentSessionId
      );

    if (!session) return;

    const msg =
      session.messages.find(
        m => m.id === messageId
      );

    if (!msg) return;

    msg.content = newContent;

    this.save(data);
  }

  static removeMessagesAfter(messageId) {
    const data = this.load();

    const session =
      data.sessions.find(
        s =>
          s.id === data.currentSessionId
      );

    if (!session) return;

    const index =
      session.messages.findIndex(
        m => m.id === messageId
      );

    if (index === -1) return;

    session.messages =
      session.messages.slice(0, index + 1);

    this.save(data);
  }

  static removeLastAssistantMessage() {
    const data = this.load();

    const session =
      data.sessions.find(
        s =>
          s.id === data.currentSessionId
      );

    if (!session) return;

    for (
      let i =
        session.messages.length - 1;
      i >= 0;
      i--
    ) {
      if (
        session.messages[i].role ===
        "assistant"
      ) {
        session.messages.splice(i, 1);
        break;
      }
    }

    this.save(data);
  }

  static getLastUserMessage() {
    const messages =
      this.getMessages();

    for (
      let i = messages.length - 1;
      i >= 0;
      i--
    ) {
      if (
        messages[i].role === "user"
      ) {
        return messages[i];
      }
    }

    return null;
  }
}