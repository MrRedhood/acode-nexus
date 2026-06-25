import AIService from "../services/ai-service.js";
import SessionService from "../services/session-service.js";
import parseMarkdown from "../utils/markdown.js";

export default class ChatView {
  constructor(container) {
    this.container = container;
  }

  render() {
    this.container.innerHTML = `
      <div id="chat-messages" class="nexus-chat"></div>

      <div class="nexus-input-area">
        <textarea
          id="chat-input"
          class="nexus-textarea"
          placeholder="Ask Nexus anything..."
        ></textarea>

        <button id="send-btn" class="nexus-button">
          Send
        </button>
      </div>
    `;

    this.renderMessages();

    const sendBtn =
      this.container.querySelector("#send-btn");

    const input =
      this.container.querySelector("#chat-input");

    sendBtn.addEventListener("click", () => {
      this.sendMessage();
    });

    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  renderMessages() {
    const box =
      this.container.querySelector("#chat-messages");

    if (!box) return;

    box.innerHTML = "";

    const messages =
      SessionService.getMessages();

    messages.forEach(msg => {
      this.appendMessage(
        msg.role === "user" ? "You" : "Nexus",
        msg.content,
        false
      );
    });

    box.scrollTop = box.scrollHeight;
  }

  appendMessage(role, text, persist = true) {
    const box =
      this.container.querySelector("#chat-messages");

    if (!box) return;

    const msg = document.createElement("div");

    let cssClass = "nexus-msg ";

    if (role === "You") {
      cssClass += "nexus-user";
    } else {
      cssClass += "nexus-ai";
    }

    msg.className = cssClass;

    const rendered =
      role === "You"
        ? text.replace(/\n/g, "<br>")
        : parseMarkdown(text);

    msg.innerHTML =
      `<strong>${role}</strong><br>${rendered}`;

    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;

    if (persist) {
      SessionService.addMessage(
        role === "You" ? "user" : "assistant",
        text
      );
    }
  }

  async sendMessage() {
    const input =
      this.container.querySelector("#chat-input");

    const text = input.value.trim();

    if (!text) return;

    input.disabled = true;

    this.appendMessage("You", text);
    input.value = "";

    this.appendMessage("Nexus", "Thinking...");

    const box =
      this.container.querySelector("#chat-messages");

    const thinkingNode = box.lastChild;

    try {
      const response =
        await AIService.sendMessage(text);

      const rendered =
        parseMarkdown(response);

      thinkingNode.innerHTML =
        `<strong>Nexus</strong><br>${rendered}`;

      const data = SessionService.load();

      const session =
        data.sessions.find(
          s => s.id === data.currentSessionId
        );

      if (session && session.messages.length > 0) {
        session.messages.pop();

        session.messages.push({
          role: "assistant",
          content: response
        });

        SessionService.save(data);
      }
    } catch (error) {
      console.error(error);

      thinkingNode.innerHTML =
        `<strong>Error</strong><br>${error.message}`;
    } finally {
      input.disabled = false;
      input.focus();

      const box =
        this.container.querySelector("#chat-messages");

      if (box) {
        box.scrollTop = box.scrollHeight;
      }
    }
  }
}