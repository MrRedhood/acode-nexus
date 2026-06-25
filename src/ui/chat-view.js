import AIService from "../services/ai-service.js";
import SessionService from "../services/session-service.js";
import parseMarkdown from "../utils/markdown.js";

export default class ChatView {
  constructor(container) {
    this.container = container;
    this.activeController = null;
    this.isGenerating = false;
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
      this.appendMessageObject(msg, false);
    });

    box.scrollTop = box.scrollHeight;
  }

  appendMessageObject(message, persist = true) {
    const box =
      this.container.querySelector("#chat-messages");

    if (!box) return;

    const msg = document.createElement("div");
    msg.className =
      "nexus-msg " +
      (message.role === "user"
        ? "nexus-user"
        : "nexus-ai");

    msg.dataset.messageId = message.id;

    const rendered =
      message.role === "user"
        ? message.content.replace(/\n/g, "<br>")
        : parseMarkdown(message.content);

    const label =
      message.role === "user"
        ? "You"
        : "Nexus";

    msg.innerHTML =
      `<strong>${label}</strong><br>${rendered}`;

    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;

    if (persist) {
      SessionService.addMessage(
        message.role,
        message.content
      );
    }

    return msg;
  }

  async sendMessage() {
    if (this.isGenerating) return;

    const input =
      this.container.querySelector("#chat-input");

    const sendBtn =
      this.container.querySelector("#send-btn");

    const text = input.value.trim();

    if (!text) return;

    this.isGenerating = true;

    input.disabled = true;
    sendBtn.disabled = true;

    const userMessage = {
      id: "msg_" + Date.now(),
      role: "user",
      content: text
    };

    this.appendMessageObject(userMessage);
    input.value = "";

    const assistantMessage = {
      id: "msg_" + (Date.now() + 1),
      role: "assistant",
      content: "Thinking..."
    };

    const assistantNode =
      this.appendMessageObject(
        assistantMessage,
        false
      );

    try {
      const response =
        await AIService.sendMessage(text);

      assistantMessage.content = response;

      assistantNode.innerHTML =
        `<strong>Nexus</strong><br>${parseMarkdown(response)}`;

      SessionService.addMessage(
        "assistant",
        response
      );
    } catch (error) {
      console.error(error);

      assistantNode.innerHTML =
        `<strong>Error</strong><br>${error.message}`;
    } finally {
      this.isGenerating = false;

      input.disabled = false;
      sendBtn.disabled = false;

      input.focus();

      const box =
        this.container.querySelector("#chat-messages");

      if (box) {
        box.scrollTop = box.scrollHeight;
      }
    }
  }
}