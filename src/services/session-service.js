import AttachmentStorage from "./attachment-storage.js";
import WorkspaceScopeService from "./workspace-scope-service.js";

const STORAGE_KEY =
  "acode_nexus_sessions";

export default class SessionService {
  static createMessage(
    role,
    content,
    attachmentIds = []
  ) {
    return {
      id:
        "msg_" +
        Date.now() +
        "_" +
        Math.random()
          .toString(36)
          .slice(2),
      role,
      content,
      attachmentIds,
      createdAt: Date.now()
    };
  }

  static createSessionObject(
    title = "New Chat"
  ) {
    return {
      id:
        "session_" +
        Date.now() +
        "_" +
        Math.random()
          .toString(36)
          .slice(2),
      title,
      workspaceId:
        this.getCurrentWorkspaceId(),
      messages: []
    };
  }

  static normalizeData(data) {
    if (
      !data ||
      !Array.isArray(data.sessions)
    ) {
      return {
        currentSessionId:
          "session_1",
        sessions: [
          {
            id: "session_1",
            title: "New Chat",
            workspaceId:
              "default",
            messages: []
          }
        ]
      };
    }

    data.sessions.forEach(
      session => {
        if (
          !session.workspaceId
        ) {
          session.workspaceId =
            "default";
        }

        if (
          !Array.isArray(
            session.messages
          )
        ) {
          session.messages = [];
        }

        delete session.attachments;

        session.messages =
          session.messages.map(
            msg => {
              if (!msg.id) {
                msg.id =
                  "msg_" +
                  Date.now() +
                  "_" +
                  Math.random()
                    .toString(36)
                    .slice(2);
              }

              if (
                !msg.createdAt
              ) {
                msg.createdAt =
                  Date.now();
              }

              if (
                !msg.content
              ) {
                msg.content =
                  "";
              }

              if (
                !Array.isArray(
                  msg.attachmentIds
                )
              ) {
                msg.attachmentIds =
                  [];
              }

              return msg;
            }
          );
      }
    );

    if (
      !data.currentSessionId
    ) {
      data.currentSessionId =
        data.sessions.length > 0
          ? data.sessions[0].id
          : null;
    }

    return data;
  }

  static load() {
    try {
      const raw =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!raw) {
        const defaultData = {
          currentSessionId:
            "session_1",
          sessions: [
            {
              id: "session_1",
              title:
                "New Chat",
              workspaceId:
                "default",
              messages: []
            }
          ]
        };

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            defaultData
          )
        );

        return defaultData;
      }

      const parsed =
        JSON.parse(raw);

      const normalized =
        this.normalizeData(
          parsed
        );

      this.save(normalized);

      return normalized;
    } catch (error) {
      console.error(error);

      return {
        currentSessionId:
          "session_1",
        sessions: [
          {
            id: "session_1",
            title: "New Chat",
            workspaceId:
              "default",
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

  static getCurrentWorkspaceId() {
    return (
      WorkspaceScopeService.getSelectedRoot() ||
      "default"
    );
  }

  static getSessions() {
    return this.load().sessions;
  }

  static getSessionsByWorkspace(
    workspaceId = null
  ) {
    const target =
      workspaceId ||
      this.getCurrentWorkspaceId();

    return this.getSessions().filter(
      session =>
        (
          session.workspaceId ||
          "default"
        ) === target
    );
  }

  static ensureWorkspaceSession() {
    const workspaceId =
      this.getCurrentWorkspaceId();

    const sessions =
      this.getSessionsByWorkspace(
        workspaceId
      );

    if (sessions.length > 0) {
      this.setActiveSession(
        sessions[0].id
      );

      return sessions[0];
    }

    return this.createSession();
  }

  static collectUsedAttachmentIds() {
    const data = this.load();

    const usedIds = [];

    data.sessions.forEach(
      session => {
        session.messages.forEach(
          msg => {
            (
              msg.attachmentIds || []
            ).forEach(id => {
              usedIds.push(id);
            });
          }
        );
      }
    );

    return [...new Set(usedIds)];
  }

  static cleanupUnusedAttachments() {
    const usedIds =
      this.collectUsedAttachmentIds();

    AttachmentStorage
      .cleanupUnused(usedIds)
      .catch(error => {
        console.error(
          "Attachment cleanup failed:",
          error
        );
      });
  }

  static getCurrentSession() {
    const data = this.load();

    return data.sessions.find(
      session =>
        session.id ===
        data.currentSessionId
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
    return this.load()
      .currentSessionId;
  }

  static setActiveSession(id) {
    const data = this.load();
    data.currentSessionId = id;
    this.save(data);
  }

  static createSession() {
    const data = this.load();

    const newSession =
      this.createSessionObject();

    data.sessions.unshift(
      newSession
    );

    data.currentSessionId =
      newSession.id;

    this.save(data);

    return newSession;
  }

  static renameSession(
    sessionId,
    newTitle
  ) {
    const data = this.load();

    const session =
      data.sessions.find(
        s => s.id === sessionId
      );

    if (!session) {
      return false;
    }

    const cleanTitle =
      (newTitle || "").trim();

    if (!cleanTitle) {
      return false;
    }

    session.title =
      cleanTitle.slice(0, 60);

    this.save(data);

    return true;
  }

  static duplicateSession(
    sessionId
  ) {
    const data = this.load();

    const original =
      data.sessions.find(
        s => s.id === sessionId
      );

    if (!original) {
      return null;
    }

    const cloned = {
      id:
        "session_" +
        Date.now() +
        "_" +
        Math.random()
          .toString(36)
          .slice(2),
      title:
        (original.title ||
          "New Chat") +
        " (Copy)",
      workspaceId:
        original.workspaceId,
      messages:
        original.messages.map(
          msg => ({
            ...msg,
            id:
              "msg_" +
              Date.now() +
              "_" +
              Math.random()
                .toString(36)
                .slice(2)
          })
        )
    };

    data.sessions.unshift(
      cloned
    );

    data.currentSessionId =
      cloned.id;

    this.save(data);

    return cloned;
  }

  static deleteSession(
    sessionId
  ) {
    const data = this.load();

    const index =
      data.sessions.findIndex(
        s => s.id === sessionId
      );

    if (index === -1) {
      return false;
    }

    data.sessions.splice(
      index,
      1
    );

    if (
      data.sessions.length === 0
    ) {
      const newSession =
        this.createSessionObject();

      data.sessions.push(
        newSession
      );

      data.currentSessionId =
        newSession.id;
    } else if (
      data.currentSessionId ===
      sessionId
    ) {
      data.currentSessionId =
        data.sessions[0].id;
    }

    this.save(data);
    this.cleanupUnusedAttachments();

    return true;
  }

  static exportSession(
    sessionId,
    format = "txt"
  ) {
    const data = this.load();

    const session =
      data.sessions.find(
        s => s.id === sessionId
      );

    if (!session) {
      return null;
    }

    if (format === "json") {
      return JSON.stringify(
        session,
        null,
        2
      );
    }

    if (format === "md") {
      let output =
        `# ${session.title}\n\n`;

      session.messages.forEach(
        msg => {
          output +=
            `## ${msg.role}\n` +
            `${msg.content}\n\n`;
        }
      );

      return output;
    }

    let output =
      `${session.title}\n\n`;

    session.messages.forEach(
      msg => {
        output +=
          `${msg.role.toUpperCase()}:\n` +
          `${msg.content}\n\n`;
      }
    );

    return output;
  }

  static addMessage(
    role,
    content,
    attachmentIds = []
  ) {
    const message =
      this.createMessage(
        role,
        content,
        attachmentIds
      );

    this.addExistingMessage(
      message
    );

    return message;
  }

  static addExistingMessage(
    message
  ) {
    const data = this.load();

    const session =
      data.sessions.find(
        s =>
          s.id ===
          data.currentSessionId
      );

    if (!session) {
      return null;
    }

    if (
      !Array.isArray(
        message.attachmentIds
      )
    ) {
      message.attachmentIds =
        [];
    }

    session.messages.push(
      message
    );

    if (
      session.title ===
        "New Chat" &&
      message.role === "user"
    ) {
      session.title =
        message.content.slice(
          0,
          30
        );
    }

    this.save(data);

    return message;
  }

  static updateMessage(
    messageId,
    newContent
  ) {
    const data = this.load();

    const session =
      data.sessions.find(
        s =>
          s.id ===
          data.currentSessionId
      );

    if (!session) {
      return;
    }

    const msg =
      session.messages.find(
        m => m.id === messageId
      );

    if (!msg) {
      return;
    }

    msg.content = newContent;

    this.save(data);
  }

  static updateMessageWithAttachments(
    messageId,
    newContent,
    attachmentIds = []
  ) {
    const data = this.load();

    const session =
      data.sessions.find(
        s =>
          s.id ===
          data.currentSessionId
      );

    if (!session) {
      return false;
    }

    const msg =
      session.messages.find(
        m => m.id === messageId
      );

    if (!msg) {
      return false;
    }

    msg.content = newContent;
    msg.attachmentIds =
      attachmentIds;

    this.save(data);

    return true;
  }

  static removeMessagesAfter(
    messageId
  ) {
    const data = this.load();

    const session =
      data.sessions.find(
        s =>
          s.id ===
          data.currentSessionId
      );

    if (!session) {
      return;
    }

    const index =
      session.messages.findIndex(
        m => m.id === messageId
      );

    if (index === -1) {
      return;
    }

    session.messages =
      session.messages.slice(
        0,
        index + 1
      );

    this.save(data);
    this.cleanupUnusedAttachments();
  }

  static removeLastAssistantMessage() {
    const data = this.load();

    const session =
      data.sessions.find(
        s =>
          s.id ===
          data.currentSessionId
      );

    if (!session) {
      return;
    }

    for (
      let i =
        session.messages.length - 1;
      i >= 0;
      i--
    ) {
      if (
        session.messages[i]
          .role ===
        "assistant"
      ) {
        session.messages.splice(
          i,
          1
        );
        break;
      }
    }

    this.save(data);
  }

  static getLastUserMessage() {
    const messages =
      this.getMessages();

    for (
      let i =
        messages.length - 1;
      i >= 0;
      i--
    ) {
      if (
        messages[i].role ===
        "user"
      ) {
        return messages[i];
      }
    }

    return null;
  }
}